'use client';

import { useState, useEffect } from 'react';

export default function NotificationSettings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [campaignNotifications, setCampaignNotifications] = useState(true);

  useEffect(() => {
    // Load settings from localStorage or API
    const saved = localStorage.getItem('notificationSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      setNotificationsEnabled(settings.notificationsEnabled || false);
      setMessageNotifications(settings.messageNotifications ?? true);
      setOrderNotifications(settings.orderNotifications ?? true);
      setCampaignNotifications(settings.campaignNotifications ?? true);
    }
  }, []);

  const handleSave = () => {
    const settings = {
      notificationsEnabled,
      messageNotifications,
      orderNotifications,
      campaignNotifications,
    };
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notisinställningar</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Push-notiser</p>
              <p className="text-sm text-gray-500">Få notiser i webbläsaren</p>
            </div>
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`w-12 h-6 rounded-full transition-colors ${
                notificationsEnabled ? 'bg-primary-900' : 'bg-gray-300'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  notificationsEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {notificationsEnabled && (
            <>
              <div className="flex items-center justify-between pl-4 border-l-2 border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">Meddelanden</p>
                  <p className="text-sm text-gray-500">Nya meddelanden i konversationer</p>
                </div>
                <button
                  onClick={() => setMessageNotifications(!messageNotifications)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    messageNotifications ? 'bg-primary-900' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      messageNotifications ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between pl-4 border-l-2 border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">Beställningar</p>
                  <p className="text-sm text-gray-500">Statusuppdateringar för beställningar</p>
                </div>
                <button
                  onClick={() => setOrderNotifications(!orderNotifications)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    orderNotifications ? 'bg-primary-900' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      orderNotifications ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between pl-4 border-l-2 border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">Campaigns</p>
                  <p className="text-sm text-gray-500">Påminnelser och uppdateringar</p>
                </div>
                <button
                  onClick={() => setCampaignNotifications(!campaignNotifications)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    campaignNotifications ? 'bg-primary-900' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      campaignNotifications ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full bg-primary-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-800 transition"
      >
        Spara inställningar
      </button>
    </div>
  );
}
