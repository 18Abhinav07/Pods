namespace Pods.Domain.Exceptions;

public class DomainRuleViolationException : Exception
{
    public DomainRuleViolationException(string message) : base(message) { }
    public DomainRuleViolationException(string message, Exception innerException) : base(message, innerException) { }
}
