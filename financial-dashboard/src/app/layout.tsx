import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Navbar from "@/components/Navbar";
import "@/styles/globals.css";
import '../styles/globals.css';


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <head>
          <title>Financial Dashboard</title>
        </head>
        <body>
          <Navbar />
          <main className="p-4">
            <SignedIn>
              {/* Show user profile if signed in */}
              <UserButton />
              {children}
            </SignedIn>
            <SignedOut>
              {/* Show sign-in button if logged out */}
              <SignInButton />
            </SignedOut>
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
