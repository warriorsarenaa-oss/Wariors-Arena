"use client";

import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../../components/admin/AdminLayout';
import ReservationsView from '../../../../components/admin/ReservationsView';
import RevenueView from '../../../../components/admin/RevenueView';
import ManageSlotsView from '../../../../components/admin/ManageSlotsView';
import SettingsView from '../../../../components/admin/SettingsView';
import ExportView from '../../../../components/admin/ExportView';

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState('reservations');
  const [notifications, setNotifications] = useState(0);

  // Poll for notifications
  useEffect(() => {
    const checkNotifications = async () => {
       try {
          const res = await fetch('/api/admin/notifications');
          const data = await res.json();
          if (data.count > 0) {
              setNotifications(data.count);
          }
       } catch (e) {}
    };

    const interval = setInterval(checkNotifications, 30000);
    checkNotifications(); // Initial check
    return () => clearInterval(interval);
  }, []);

  // Clear notifications when entering reservations view
  useEffect(() => {
     if (activeSection === 'reservations') {
         setNotifications(0);
     }
  }, [activeSection]);

  const renderContent = () => {
    switch (activeSection) {
      case 'reservations': return <ReservationsView />;
      case 'revenue': return <RevenueView />;
      case 'slots': return <ManageSlotsView />;
      case 'settings': return <SettingsView />;
      case 'export': return <ExportView />;
      default: return <ReservationsView />;
    }
  };

  return (
    <AdminLayout 
      activeSection={activeSection} 
      onSectionChange={setActiveSection}
    >
      {renderContent()}
    </AdminLayout>
  );
}
