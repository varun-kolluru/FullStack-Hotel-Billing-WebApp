// components/Header.js
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";

export default function Header() {
  const router = useRouter();
  const { data: session } = useSession();

  return (
      <div className='flex h-24'>
        <div className='w-1/4 flex items-start justify-start'>
        {session.user.isAdmin && (
          <nav className="flex flex-col mt-4 md:flex-row p-1 md:p-4 space-y-2 md:space-x-2">
            <button onClick={() => router.push('/home')} className="bg-blue-500 hover:bg-blue-600 p-1 md:p-2 text-xs md:text-base rounded">Home</button>
            <button onClick={() => router.push('/menu-page')} className="bg-blue-500 hover:bg-blue-600 p-1 md:p-2 text-xs md:text-base rounded">Items Menu</button>
            <button onClick={() => router.push('/report-page')} className="bg-blue-500 hover:bg-blue-600 p-1 md:p-2 text-xs md:text-base rounded">Sales Report</button>
            <button onClick={() => router.push('/captains-page')} className="bg-blue-500 hover:bg-blue-600 p-1 md:p-2 text-xs md:text-base rounded">Captains</button>
          </nav>
        )}
        </div>

        <div className='w-1/2 flex items-start justify-center'>        
          <div className="w-full h-full overflow-hidden">
            <img src="../Img/Logo.PNG" alt="Logo" className="w-full h-full object-contain"/>
          </div>
        </div>

        <div className='w-1/4 flex items-start justify-end'>
          <button onClick={() => signOut()} className="bg-red-700 hover:bg-red-800 transition-colors duration-300 text-white text-xs md:text-base px-4 py-2 rounded-full">
            Sign out
          </button>
        </div>
      </div>
  );
}