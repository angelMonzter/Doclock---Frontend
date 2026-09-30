import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/TextField';
import { Notice } from '@/components/ui/Notice';
import { loginSchema, type LoginValues } from '../schemas/loginSchema';
import { demoCredentials } from '../services/mockAuthService';
import { useLogin } from '../hooks/useLogin';

export function LoginForm() {
  const [visible, setVisible] = useState(false);
  const [help, setHelp] = useState(false);
  const login = useLogin();
  const { register, handleSubmit, reset, setFocus, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' },
  });
  function fillDemo() { login.reset(); reset(demoCredentials); setFocus('email'); }
  return <>
    <form className="login-form" noValidate onSubmit={handleSubmit((values) => { setHelp(false); login.mutate(values); })} aria-busy={login.isPending}>
      <fieldset disabled={login.isPending} className="form-fields">
        <TextField label="Correo electrónico" type="email" placeholder="nombre@organizacion.com" autoComplete="username" autoCapitalize="none" spellCheck={false}
          leadingIcon={<Mail size={19} />} error={errors.email?.message} {...register('email')} />
        <TextField label="Contraseña" type={visible ? 'text' : 'password'} placeholder="Escribe tu contraseña" autoComplete="current-password"
          leadingIcon={<LockKeyhole size={19} />} error={errors.password?.message} {...register('password')}
          trailingAction={<button className="password-toggle" type="button" aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={visible} onClick={() => setVisible(!visible)}>
            {visible ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>} />
      </fieldset>
      <div className="recovery-row"><button className="text-link" type="button" aria-expanded={help} onClick={() => setHelp(!help)}>¿Olvidaste tu contraseña?</button></div>
      {help && <Notice>La recuperación estará disponible al conectar el sistema. Por ahora, utiliza los datos de prueba de abajo.</Notice>}
      {login.isError && <Notice tone="error">{login.error.message}</Notice>}
      <Button type="submit" className="w-full" disabled={login.isPending}>
        {login.isPending ? <><LoaderCircle className="loading-icon" size={19} /> Verificando acceso…</> : <>Iniciar sesión <ArrowRight size={18} aria-hidden="true" /></>}
      </Button>
    </form>
    <div className="demo-panel">
      <div className="demo-title"><span className="demo-dot" /> Explora la versión de prueba</div>
      <p>Prueba el acceso con una cuenta de demostración.</p>
      <dl><div><dt>Correo</dt><dd>{demoCredentials.email}</dd></div><div><dt>Contraseña</dt><dd>{demoCredentials.password}</dd></div></dl>
      <Button variant="secondary" size="small" className="w-full" disabled={login.isPending} onClick={fillDemo}>Usar datos de prueba <ArrowRight size={16} aria-hidden="true" /></Button>
    </div>
  </>;
}
