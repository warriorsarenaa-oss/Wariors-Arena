'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const navItems = [
  { id: 'reservations', label: 'Reservations', icon: '📅' },
  { id: 'revenue', label: 'Revenue', icon: '💰' },
  { id: 'slots', label: 'Manage Slots', icon: '⏰' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
  { id: 'export', label: 'Export', icon: '📊' },
];

export default function AdminLayout({ 
  children, 
  activeSection, 
  onSectionChange 
}: AdminLayoutProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/en/admin/login');
  }

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      backgroundColor: '#0A0A0F',
      color: 'white'
    }}>
      <aside style={{
        width: '220px',
        backgroundColor: '#13131A',
        borderRight: '1px solid #1E1E2E',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
        position: 'fixed',
        height: '100vh',
        left: 0,
        top: 0,
      }}>
        <div style={{ 
          padding: '0 20px 24px', 
          borderBottom: '1px solid #1E1E2E',
          marginBottom: '16px'
        }}>
          <div style={{ 
            fontSize: '14px', 
            fontWeight: '700', 
            color: '#00FFCC',
            letterSpacing: '0.1em'
          }}>
            WARRIORS ARENA
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: '#A0A0B8',
            marginTop: '2px'
          }}>
            Admin Dashboard
          </div>
        </div>

        <nav style={{ flex: 1, padding: '0 12px' }}>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                marginBottom: '4px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeSection === item.id ? '600' : '400',
                backgroundColor: activeSection === item.id 
                  ? 'rgba(0,255,204,0.1)' : 'transparent',
                color: activeSection === item.id 
                  ? '#00FFCC' : '#A0A0B8',
                textAlign: 'left',
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '1px solid #1E1E2E' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #FF3B3B',
              backgroundColor: 'transparent',
              color: '#FF3B3B',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      <main style={{ 
        marginLeft: '220px', 
        flex: 1, 
        padding: '32px',
        minHeight: '100vh',
      }}>
        {children}
      </main>
    </div>
  );
}
