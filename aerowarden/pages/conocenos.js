import Header from "@/Componets/common/Header";

export default function conocenos() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-10">
      <Header />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <section className="rounded-4xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="mb-10 text-center">
            <h1 className="mb-4 text-center text-3xl font-semibold text-slate-900">Conócenos</h1>
          </div>

          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            <article className="flex min-h-105 flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div>
                <h2 className="mb-4 text-center text-3xl font-semibold text-slate-900">Nuestra misión</h2>
                <img
                  src="/images/mision.jpg"
                  className="mb-5 h-44 w-full rounded-2xl object-cover"
                />
                <p className="text-slate-600 leading-7">
                  En AeroWarden creemos que la gestión aeronáutica puede ser más eficiente, organizada y accesible mediante herramientas digitales. Nuestro objetivo es ayudar a hangares, talleres y organizaciones aeronáuticas a optimizar sus procesos operativos.
                </p>
              </div>
            </article>

            <article className="flex min-h-105 flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div>
                <h2 className="mb-4 text-center text-3xl font-semibold text-slate-900">Nuestra visión</h2>
                <img
                  src="/images/vision.jpg"
                  className="mb-5 h-44 w-full rounded-2xl object-cover"
                />
                <p className="text-slate-600 leading-7">
                  Queremos ser la herramienta de referencia para la gestión digital de hangares aeronáuticos, aportando eficiencia, modernidad y preparación para los desafíos tecnológicos del futuro.
                </p>
              </div>
            </article>

            <article className="flex min-h-105 flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div>
                <h2 className="mb-4 text-center text-3xl font-semibold text-slate-900">¿Por qué AeroWarden?</h2>
                <img
                  src="/images/porque.jpg"
                  className="mb-5 h-44 w-full rounded-2xl object-cover"
                />
                <p className="text-slate-600 leading-7">
                  Nuestra solución centraliza información, mejora la trazabilidad y facilita el control operativo de aeronaves, mantenimientos y actividades pendientes en un solo lugar.
                </p>
              </div>
            </article>
          </div>

          <article className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center shadow-sm">
            <h2 className="mb-4 text-3xl font-semibold text-slate-900">Contáctanos</h2>
            <img
              src="/images/contacto.jpg"
              className="mx-auto mb-5 h-44 w-full rounded-2xl object-cover"
            />
            <img
              src="/Standard-Aviation-40.jpg"
              alt="Standard Aviation"
              className="mx-auto mb-5 h-44 w-full rounded-2xl object-cover"
            />
            <p className="mx-auto max-w-2xl text-slate-600 leading-7">
              Escríbenos a <strong>aerowarden@gmail.com</strong> o llámanos al <strong>+52 639 177 0731</strong>. Estamos listos para ayudarte a llevar tu gestión aeronáutica al siguiente nivel.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}
