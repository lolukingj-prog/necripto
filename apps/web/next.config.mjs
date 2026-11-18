/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // La wallet corre en el navegador: el servidor de Next no almacena
  // material criptografico y la aplicacion puede exportarse estatica
  // si el panel de comercio no llega a necesitar servidor.
};

export default nextConfig;
