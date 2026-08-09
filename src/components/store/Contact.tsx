import { Mail, MessageCircle } from "lucide-react";

export const CONTACT_EMAIL = "apolinariolizete5@gmail.com";
export const CONTACT_WHATSAPP = "258834102205";
export const CONTACT_WHATSAPP_DISPLAY = "+258 83 410 2205";
export const CONTACT_WHATSAPP_URL = `https://wa.me/${CONTACT_WHATSAPP}`;
export const CONTACT_EMAIL_URL = `mailto:${CONTACT_EMAIL}`;

export function Contact() {
  return (
    <section id="contacto" className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
            Contacto
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Fale connosco
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Tire dúvidas, peça informações ou encomende diretamente pelo WhatsApp.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2">
          <a
            href={CONTACT_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition hover:border-primary hover:shadow-[var(--shadow-lift)]"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-success/15 text-success">
              <MessageCircle className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                WhatsApp
              </span>
              <span className="block truncate text-sm font-semibold text-foreground group-hover:text-primary">
                {CONTACT_WHATSAPP_DISPLAY}
              </span>
            </span>
          </a>

          <a
            href={CONTACT_EMAIL_URL}
            className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition hover:border-primary hover:shadow-[var(--shadow-lift)]"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <Mail className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                E-mail
              </span>
              <span className="block truncate text-sm font-semibold text-foreground group-hover:text-primary">
                {CONTACT_EMAIL}
              </span>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}