import './EmptyState.css';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state-block">
      {Icon && (
        <div className="empty-state-block__icon">
          <Icon size={22} aria-hidden="true" />
        </div>
      )}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div className="empty-state-block__action">{action}</div>}
    </div>
  );
}