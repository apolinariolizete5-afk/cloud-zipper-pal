import { CONTACT_EMAIL, CONTACT_EMAIL_URL, CONTACT_WHATSAPP_DISPLAY, CONTACT_WHATSAPP_URL } from "./Contact";

export function Footer({ brand }: { brand: string }) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <p className="text-base font-semibold text-foreground">{brand}</p>
            <p className="mt-1 text-xs text-muted-foreground">Beleza que se sente na pele.</p>
          </div>
          <div className="text-sm">
            <p className="mb-2 font-medium text-foreground">Links</p>
            <ul className="space-y-1 text-muted-foreground">
              <li><a href="#produto" className="hover:text-foreground">Produtos</a></li>
              <li><a href="#" className="hover:text-foreground">Sobre nós</a></li>
              <li><a href="#contacto" className="hover:text-foreground">Contacto</a></li>
              <li><a href="#" className="hover:text-foreground">Termos</a></li>
            </ul>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Contacto</p>
            <p className="mt-1">Maputo, Moçambique</p>
            <p>
              <a href={CONTACT_EMAIL_URL} className="hover:text-foreground">{CONTACT_EMAIL}</a>
            </p>
            <p>
              <a href={CONTACT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
                WhatsApp: {CONTACT_WHATSAPP_DISPLAY}
              </a>
            </p>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {year} {brand}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}