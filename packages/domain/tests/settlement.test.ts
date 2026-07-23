import { describe, expect, it } from "vitest";

import { calculateSettlement } from "../src/settlement";

const members = [
  { membershipId: "00000000-0000-4000-8000-000000000001", depositLuna: 5 },
  { membershipId: "00000000-0000-4000-8000-000000000002", depositLuna: 5 },
  { membershipId: "00000000-0000-4000-8000-000000000003", depositLuna: 5 },
  { membershipId: "00000000-0000-4000-8000-000000000004", depositLuna: 5 },
  { membershipId: "00000000-0000-4000-8000-000000000005", depositLuna: 5 }
] as const;

describe("calculateSettlement", () => {
  it("protects approved principal and distributes forfeitures with a stable remainder", () => {
    const settlement = calculateSettlement({
      lunaPerOccurrence: 5,
      members,
      occurrences: [
        {
          occurrenceId: "10000000-0000-4000-8000-000000000001",
          outcomes: [
            { membershipId: members[0].membershipId, state: "approved" },
            { membershipId: members[1].membershipId, state: "approved" },
            { membershipId: members[2].membershipId, state: "rejected" },
            { membershipId: members[3].membershipId, state: "missed" },
            { membershipId: members[4].membershipId, state: "rejected" }
          ]
        }
      ]
    });

    expect(settlement.occurrences[0]).toMatchObject({
      state: "closed",
      forfeiturePoolLuna: 15,
      bonusRecipientCount: 2
    });
    expect(settlement.members).toEqual([
      expect.objectContaining({
        membershipId: members[0].membershipId,
        principalLuna: 5,
        bonusLuna: 8,
        payoutLuna: 13
      }),
      expect.objectContaining({
        membershipId: members[1].membershipId,
        principalLuna: 5,
        bonusLuna: 7,
        payoutLuna: 12
      }),
      expect.objectContaining({
        membershipId: members[2].membershipId,
        provisionalForfeitureLuna: 5,
        payoutLuna: 0
      }),
      expect.objectContaining({
        membershipId: members[3].membershipId,
        provisionalForfeitureLuna: 5,
        payoutLuna: 0
      }),
      expect.objectContaining({
        membershipId: members[4].membershipId,
        provisionalForfeitureLuna: 5,
        payoutLuna: 0
      })
    ]);
    expect(settlement.totalDepositLuna).toBe(25);
    expect(settlement.totalPayoutLuna).toBe(25);
  });

  it("protects timeout principal without making it bonus eligible", () => {
    const selected = members.slice(0, 3).map((member) => ({
      ...member,
      depositLuna: 10
    }));
    const settlement = calculateSettlement({
      lunaPerOccurrence: 10,
      members: selected,
      occurrences: [
        {
          occurrenceId: "10000000-0000-4000-8000-000000000002",
          outcomes: [
            { membershipId: selected[0]!.membershipId, state: "approved" },
            {
              membershipId: selected[1]!.membershipId,
              state: "timeout_protected"
            },
            { membershipId: selected[2]!.membershipId, state: "rejected" }
          ]
        }
      ]
    });

    expect(settlement.members).toEqual([
      expect.objectContaining({
        membershipId: selected[0]!.membershipId,
        principalLuna: 10,
        bonusLuna: 10,
        payoutLuna: 20
      }),
      expect.objectContaining({
        membershipId: selected[1]!.membershipId,
        principalLuna: 10,
        bonusLuna: 0,
        payoutLuna: 10
      }),
      expect.objectContaining({
        membershipId: selected[2]!.membershipId,
        provisionalForfeitureLuna: 10,
        payoutLuna: 0
      })
    ]);
  });

  it("restores provisional forfeitures when an occurrence has no approved member", () => {
    const selected = members.slice(0, 2).map((member) => ({
      ...member,
      depositLuna: 10
    }));
    const settlement = calculateSettlement({
      lunaPerOccurrence: 10,
      members: selected,
      occurrences: [
        {
          occurrenceId: "10000000-0000-4000-8000-000000000003",
          outcomes: [
            { membershipId: selected[0]!.membershipId, state: "rejected" },
            { membershipId: selected[1]!.membershipId, state: "missed" }
          ]
        }
      ]
    });

    expect(settlement.occurrences[0]).toMatchObject({
      state: "closed_no_bonus_recipient",
      forfeiturePoolLuna: 20,
      bonusRecipientCount: 0
    });
    expect(settlement.members).toEqual([
      expect.objectContaining({
        membershipId: selected[0]!.membershipId,
        provisionalForfeitureLuna: 10,
        restorationLuna: 10,
        payoutLuna: 10
      }),
      expect.objectContaining({
        membershipId: selected[1]!.membershipId,
        provisionalForfeitureLuna: 10,
        restorationLuna: 10,
        payoutLuna: 10
      })
    ]);
    expect(settlement.totalPayoutLuna).toBe(settlement.totalDepositLuna);
  });

  it("conserves all member deposits across multiple occurrences", () => {
    const selected = members.slice(0, 2).map((member) => ({
      ...member,
      depositLuna: 20
    }));
    const settlement = calculateSettlement({
      lunaPerOccurrence: 10,
      members: selected,
      occurrences: [
        {
          occurrenceId: "10000000-0000-4000-8000-000000000004",
          outcomes: [
            { membershipId: selected[0]!.membershipId, state: "approved" },
            { membershipId: selected[1]!.membershipId, state: "missed" }
          ]
        },
        {
          occurrenceId: "10000000-0000-4000-8000-000000000005",
          outcomes: [
            {
              membershipId: selected[0]!.membershipId,
              state: "timeout_protected"
            },
            { membershipId: selected[1]!.membershipId, state: "approved" }
          ]
        }
      ]
    });

    expect(settlement.totalDepositLuna).toBe(40);
    expect(settlement.totalPayoutLuna).toBe(40);
    expect(settlement.members.map((member) => member.payoutLuna)).toEqual([30, 10]);
  });

  it("rejects duplicate members, duplicate outcomes, and incomplete occurrence input", () => {
    const occurrenceId = "10000000-0000-4000-8000-000000000006";
    expect(() =>
      calculateSettlement({
        lunaPerOccurrence: 5,
        members: [members[0], members[0]],
        occurrences: [
          {
            occurrenceId,
            outcomes: [
              { membershipId: members[0].membershipId, state: "approved" }
            ]
          }
        ]
      })
    ).toThrow("Settlement members must be unique");
    expect(() =>
      calculateSettlement({
        lunaPerOccurrence: 5,
        members: members.slice(0, 2),
        occurrences: [
          {
            occurrenceId,
            outcomes: [
              { membershipId: members[0].membershipId, state: "approved" },
              { membershipId: members[0].membershipId, state: "approved" }
            ]
          }
        ]
      })
    ).toThrow("Occurrence outcomes must include every member exactly once");
    expect(() =>
      calculateSettlement({
        lunaPerOccurrence: 5,
        members: members.slice(0, 2),
        occurrences: [
          {
            occurrenceId,
            outcomes: [
              { membershipId: members[0].membershipId, state: "approved" }
            ]
          }
        ]
      })
    ).toThrow("Occurrence outcomes must include every member exactly once");
  });

  it("rejects a deposit that does not equal the frozen occurrence allocation", () => {
    expect(() =>
      calculateSettlement({
        lunaPerOccurrence: 5,
        members: [{ membershipId: members[0].membershipId, depositLuna: 9 }],
        occurrences: [
          {
            occurrenceId: "10000000-0000-4000-8000-000000000007",
            outcomes: [{ membershipId: members[0].membershipId, state: "approved" }]
          },
          {
            occurrenceId: "10000000-0000-4000-8000-000000000008",
            outcomes: [{ membershipId: members[0].membershipId, state: "approved" }]
          }
        ]
      })
    ).toThrow("Member deposit does not match the frozen occurrence allocation");
  });
});
