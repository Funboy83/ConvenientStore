"use client";

import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import type { User } from '@/lib/types';
import { users } from '@/lib/data';

type UserContextType = {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(users.find(u => u.role === 'Manager')!);

  const value = useMemo(() => ({
    currentUser,
    setCurrentUser,
    users,
  }), [currentUser]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
