import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/TextField';
import { Notice } from '@/components/ui/Notice';
import { loginSchema, type LoginValues } from '@/schemas/auth/loginSchema';
//code mode usuarios: acceso real, sin credenciales ni autocompletado de prueba.
import { useLogin } from '@/hooks/auth/useLogin';

export function LoginForm() {
  const [visible, setVisible] = useState(false);
  const [help, setHelp] = useState(false);
  const login = useLogin();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const [email, password] = watch(['email', 'password']);
  const hasCredentials = email.trim().length > 0 && password.length > 0;

  return (
    <>
      <form
        className="login-form"
        noValidate
        onSubmit={handleSubmit((values) => {
          setHelp(false);
          login.mutate(values);
        })}
        aria-busy={login.isPending}
      >
        <fieldset disabled={login.isPending} className="form-fields">
          <TextField
            label="Correo electrónico"
            type="email"
            placeholder="nombre@organizacion.com"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            leadingIcon={<Mail size={19} />}
            error={errors.email?.message}
            {...register('email')}
          />
          <TextField
            label="Contraseña"
            type={visible ? 'text' : 'password'}
            placeholder="Escribe tu contraseña"
            autoComplete="current-password"
            leadingIcon={<LockKeyhole size={19} />}
            error={errors.password?.message}
            {...register('password')}
            trailingAction={
              <button
                className="password-toggle"
                type="button"
                aria-label={
                  visible ? 'Ocultar contraseña' : 'Mostrar contraseña'
                }
                aria-pressed={visible}
                onClick={() => setVisible(!visible)}
              >
                {visible ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            }
          />
        </fieldset>
        <div className="recovery-row">
          <button
            className="text-link"
            type="button"
            aria-expanded={help}
            onClick={() => setHelp(!help)}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        {help && (
          <Notice>
            Solicita al administrador de tu organización que restablezca tu
            contraseña.
          </Notice>
        )}
        {login.isError && <Notice tone="error">{login.error.message}</Notice>}
        <Button
          type="submit"
          className="w-full login-submit"
          disabled={!hasCredentials || login.isPending}
        >
          {login.isPending ? (
            <>
              <LoaderCircle className="loading-icon" size={19} /> Verificando
              acceso…
            </>
          ) : (
            <>
              Iniciar sesión <ArrowRight size={18} aria-hidden="true" />
            </>
          )}
        </Button>
      </form>
    </>
  );
}
