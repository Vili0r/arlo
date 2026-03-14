import React from 'react'
import { Navbar } from '@/components/navbar'

const page = () => {
  return (
    <div className='flex flex-col min-h-screen'>
      <Navbar />
      <h1 className='text-3xl font-bold underline'>Arlo</h1>
    </div>
  )
}

export default page