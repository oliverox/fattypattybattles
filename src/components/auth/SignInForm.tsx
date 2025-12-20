'use client';

import React from 'react';
import { SignIn } from '@clerk/nextjs';

export function SignInForm() {
  return (
    <div className="flex justify-center">
      <SignIn
        routing="hash"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg"
          }
        }}
        fallbackRedirectUrl="/"
      />
    </div>
  );
}
