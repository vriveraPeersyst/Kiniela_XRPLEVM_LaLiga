"use client"
import Image from "next/image"
import { ModeToggle } from "./Modetoggle"


export default function Nav() {
  return(
    <header >
      <nav>
        <ul className="flex items-center justify-between">
          <li>
          <a
            className="pointer-events-none flex place-items-center gap-2 p-8 lg:pointer-events-auto lg:p-0"
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/MDLRlogo.jpg"
              alt="MDLR Logo"
              width={100}
              height={24}
              className="rounded-full"
              priority
            />
          </a>
          </li>
          <li><ModeToggle /></li>
        </ul>
      </nav>
    </header>
  )
}