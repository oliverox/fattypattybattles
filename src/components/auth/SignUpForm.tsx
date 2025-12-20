'use client';

import React from 'react';
import { SignUp } from '@clerk/nextjs';

export function SignUpForm() {
  return (
    <div className="flex justify-center">
      <SignUp
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
