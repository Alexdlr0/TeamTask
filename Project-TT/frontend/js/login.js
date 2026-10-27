(function () {
  'use strict';

  // Contrato propuesto (pendiente de confirmar con backend):
  //   POST /api/auth/login  { email, password }
  //   200 → { user: { id, name, email, role } }   (sesión en cookie httpOnly puesta por el servidor)
  //   400 → { error, fields?: { email?, password? } }
  //   401 → { error }
  const LOGIN_ENDPOINT = '/api/auth/login';
  const REQUEST_TIMEOUT_MS = 10000;

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const toggleBtn = document.getElementById('togglePassword');
  const submitBtn = document.getElementById('submitBtn');
  const feedback = document.getElementById('loginFeedback');

  // Mostrar / ocultar contraseña
  toggleBtn.addEventListener('click', function () {
    const isHidden = passwordInput.type === 'password';
    passwordInput.type = isHidden ? 'text' : 'password';
    toggleBtn.setAttribute('aria-pressed', String(isHidden));
    toggleBtn.setAttribute('aria-label', isHidden ? 'Ocultar contraseña' : 'Mostrar contraseña');
  });

  function setFieldError(input, errorEl, message) {
    errorEl.textContent = message || '';
    input.classList.toggle('is-invalid', Boolean(message));
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  function validateEmail() {
    const value = emailInput.value.trim();
    let message = '';
    if (!value) {
      message = 'El correo electrónico es obligatorio.';
    } else if (!EMAIL_PATTERN.test(value)) {
      message = 'Ingresa un correo electrónico válido.';
    }
    setFieldError(emailInput, emailError, message);
    return !message;
  }

  function validatePassword() {
    const message = passwordInput.value ? '' : 'La contraseña es obligatoria.';
    setFieldError(passwordInput, passwordError, message);
    return !message;
  }

  function showError(message) {
    feedback.textContent = message;
    feedback.hidden = false;
  }

  function hideFeedback() {
    feedback.hidden = true;
    feedback.textContent = '';
  }

  function setLoading(isLoading) {
    submitBtn.classList.toggle('is-loading', isLoading);
    submitBtn.disabled = isLoading;
    emailInput.disabled = isLoading;
    passwordInput.disabled = isLoading;
  }

  // Revalidar mientras se escribe sólo si el campo ya mostró un error
  emailInput.addEventListener('input', function () {
    if (emailInput.classList.contains('is-invalid')) validateEmail();
  });
  passwordInput.addEventListener('input', function () {
    if (passwordInput.classList.contains('is-invalid')) validatePassword();
  });
  emailInput.addEventListener('blur', function () {
    if (emailInput.value.trim()) validateEmail();
  });

  async function readJson(response) {
    try {
      return await response.json();
    } catch (err) {
      return {};
    }
  }

  function messageForStatus(status, data) {
    if (data && typeof data.error === 'string' && data.error) return data.error;
    switch (status) {
      case 400: return 'Revisa los datos ingresados.';
      case 401: return 'Correo o contraseña incorrectos.';
      case 429: return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
      default: return 'No se pudo iniciar sesión. Inténtalo más tarde.';
    }
  }

  async function login(email, password) {
    const controller = new AbortController();
    const timeoutId = setTimeout(function () { controller.abort(); }, REQUEST_TIMEOUT_MS);
    try {
      return await fetch(LOGIN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email: email, password: password }),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    hideFeedback();

    const emailOk = validateEmail();
    const passwordOk = validatePassword();
    if (!emailOk || !passwordOk) {
      (emailOk ? passwordInput : emailInput).focus();
      return;
    }

    const email = emailInput.value.trim();
    setLoading(true);

    let response;
    try {
      response = await login(email, passwordInput.value);
    } catch (err) {
      setLoading(false);
      showError(err.name === 'AbortError'
        ? 'El servidor tardó demasiado en responder. Inténtalo de nuevo.'
        : 'No se pudo conectar con el servidor. Revisa tu conexión.');
      return;
    }

    const data = await readJson(response);
    setLoading(false);

    // El manejo de la sesión corresponde al backend; aquí sólo se muestran errores.
    if (response.ok) return;

    if (response.status === 400 && data.fields) {
      setFieldError(emailInput, emailError, data.fields.email);
      setFieldError(passwordInput, passwordError, data.fields.password);
    }
    if (response.status === 401) {
      passwordInput.value = '';
      passwordInput.focus();
    }
    showError(messageForStatus(response.status, data));
  });
})();
