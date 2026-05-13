type StateMessageProps = {
  title: string;
  description?: string;
  tone?: "neutral" | "error" | "success";
};

export const StateMessage = ({ title, description, tone = "neutral" }: StateMessageProps) => {
  return (
    <div className={`state-message state-message--${tone}`}>
      <strong>{title}</strong>
      {description ? <span>{description}</span> : null}
    </div>
  );
};

