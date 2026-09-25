import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/Button.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../utils/getErrorMessage.js';

const initialForm = { email: '', password: '' };

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function validate() {
    const errors = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Enter a valid email address.';
    if (!form.password) errors.password = 'Enter your password.';
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
      await login({ email: form.email.trim(), password: form.password });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not log you in.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="page page--center">
      <main className="auth-page">
        <div className="auth-page__header">
          <h1>Welcome back</h1>
          <p>Log in to continue practicing.</p>
        </div>

        <form className="card form" onSubmit={handleSubmit} noValidate>
          {formError && (
            <p className="form-error-banner" role="alert">
              {formError}
            </p>
          )}

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
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              aria-invalid={Boolean(fieldErrors.password)}
              disabled={isSubmitting}
            />
            {fieldErrors.password && <span className="form-field__error">{fieldErrors.password}</span>}
          </div>

          <Button type="submit" loading={isSubmitting}>
            Log in
          </Button>
        </form>

        <p className="auth-page__footer">
          Don&apos;t have an account? <Link to="/signup">Create one</Link>
        </p>
      </main>
    </div>
  );
}