import Head from 'next/head'
import Image from 'next/image'
import { Inter } from 'next/font/google'
import styles from '@/styles/Home.module.css'
import { useEffect } from 'react'

const inter = Inter({ subsets: ['latin'] })

import {Socket} from "phoenix"
let socket = new Socket("/socket", {params: {token: "hello"}})

export default function Home() {
  useEffect(()=> {
    if(!process.browser)
      return
    
  })
  return <div>

  </div>
}
