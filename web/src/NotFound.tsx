import Logo from '@assets/forky_logo.png';

export default function NotFound() {
  return (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-stone-900">
      <img src={Logo} className="object-contain w-72 h-72" />
      <h1 className="mt-6 text-2xl text-rose-400">Page not found</h1>
    </div>
  );
}
