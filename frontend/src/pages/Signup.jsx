import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchRoles } from '../services/roles.service.js';
import { getErrorMessage } from '../utils/getErrorMessage.js';

const initialForm = { name: '', email: '', password: '', targetRoleId: '' };

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [roles, setRoles] = useState([]);
  const [rolesError, setRolesError] = useState('');

  useEffect(() => {
    let isMounted = true;
    fetchRoles()
      .then((data) => {
        if (isMounted) setRoles(data);
      })
      .catch((error) => {
        if (isMounted) setRolesError(getErrorMessage(error, 'Could not load target roles.'));
      });
    return () => {
      isMounted = false;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function validate() {
    const errors = {};
    if (form.name.trim().length < 2) errors.name = 'Enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email address.';
    if (form.password.length < 8) errors.password = 'Password must be at least 8 characters.';
    return errors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        targetRoleId: form.targetRoleId ? Number(form.targetRoleId) : undefined,
      });
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not create your account.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page page--center">
      <main className="auth-page">
        <div className="auth-page__header">
          <h1>Create your account</h1>
          <p>Start practicing for your next interview.</p>
        </div>

        <form className="card form" onSubmit={handleSubmit} noValidate>
          {formError && (
            <p className="form-error-banner" role="alert">
              {formError}
            </p>
          )}

          <div className="form-field">
            <label htmlFor="name">Full name</label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.name)}
              disabled={isSubmitting}
            />
            {fieldErrors.name && <span className="form-field__error">{fieldErrors.name}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.email)}
              disabled={isSubmitting}
            />
            {fieldErrors.email && <span className="form-field__error">{fieldErrors.email}</span>}
          </div>

          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.password)}
              disabled={isSubmitting}
            />
            {fieldErrors.password ? (
              <span className="form-field__error">{fieldErrors.password}</span>
            ) : (
              <span className="form-field__hint">At least 8 characters.</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="targetRoleId">Target role (optional)</label>
            <select
              id="targetRoleId"
              name="targetRoleId"
              value={form.targetRoleId}
              onChange={handleChange}
              disabled={isSubmitting || roles.length === 0}
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            {rolesError && <span className="form-field__error">{rolesError}</span>}
          </div>

          <p className="form-field__hint">Profile photo upload is coming in Phase 4.</p>

          <Button type="submit" loading={isSubmitting}>
            Create account
          </Button>
        </form>

        <p className="auth-page__footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </main>
    </div>
  );
}