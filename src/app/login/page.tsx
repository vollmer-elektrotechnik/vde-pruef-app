'use client'
import { useState } from 'react'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      alert(error.message)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
      <h1>Login</h1>
      <form onSubmit={handleLogin}>
        <input 
          type="email" 
          placeholder="E-Mail" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px', color: 'black' }}
        />
        <input 
          type="password" 
          placeholder="Passwort" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          style={{ display: 'block', width: '100%', marginBottom: '10px', padding: '8px', color: 'black' }}
        />
        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Anmelden
        </button>
      </form>
    </div>
  )
}