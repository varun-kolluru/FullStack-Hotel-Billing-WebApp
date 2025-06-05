import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function SignIn() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await signIn('credentials', {redirect: false,username,password});

    if (result.error) {
      setError(result.error);
    } else {
      router.push('/home');
    }
  };

  return (
    <div className="min-h-screen flex justify-center bg-[#04654C] p-4">
      <div className="w-full max-w-xl mt-14">
        {/* Image above the sign-in box */}
        <div className="w-full h-45 overflow-hidden">
          <img src="../Img/Logo.PNG" alt="Logo" className="w-full h-full object-cover"/>
        </div>
        
        {/* Sign-in box */}
        <div className="p-8 rounded-b-lg shadow-md">
          {error && <p className="text-red-500 text-xl mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
              <input type="text" id="username" value={username} placeholder='Username' onChange={(e) => setUsername(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 text-black rounded-full focus:outline-none focus:ring focus:ring-[#EABD08]"/>
              <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder='Password' required className="w-full px-3 py-2 border text-black border-gray-300 rounded-full focus:outline-none focus:ring focus:ring-[#EABD08]"/>
            <div className='flex justify-center items-center'>
              <button type="submit" className="w-1/2 bg-[#EABD08] hover:bg-[#ffd700] transition-colors duration-300 text-black text-2xl px-4 py-2 rounded-full">
                Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}