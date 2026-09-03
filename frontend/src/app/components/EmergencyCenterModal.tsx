"use client";

import React, { useState, useEffect } from 'react';
import { PhoneCall, Shield, Building2, MapPin, CheckSquare, X, HeartHandshake } from 'lucide-react';
import { LOCALIZATION, SupportedLanguage } from '../i18n';

interface EmergencyLocation {
  id: string;
  name: string;
  category: string;
  city: string;
  address: string;
  phone: string;
  capacity: string;
  distance_km: string;
}

interface EmergencyCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  location?: string;
  lang?: SupportedLanguage;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function EmergencyCenterModal({ isOpen, onClose, location = "Pune", lang = 'en' }: EmergencyCenterModalProps) {
  const [activeTab, setActiveTab] = useState<'shelters' | 'checklist' | 'contacts'>('shelters');
  const [locations, setLocations] = useState<EmergencyLocation[]>([]);
  const [hazard] = useState('flood');

  const t = LOCALIZATION[lang] || LOCALIZATION.en;

  const getLocalizedChecklist = (l: SupportedLanguage) => {
    if (l === 'hi') {
      return {
        title: "बाढ़ व भारी बारिश सुरक्षा चेकलिस्ट",
        before: [
          "मोबाइल फोन और पावर बैंक 100% चार्ज रखें।",
          "महत्वपूर्ण दस्तावेजों को वाटरप्रूफ सील बैग में रखें।",
          "निकटतम ऊंचे स्थान वाले राहत शिविर की पहचान करें।",
          "कम से कम 3 दिनों का स्वच्छ पेयजल और सूखा भोजन सुरक्षित रखें।"
        ],
        during: [
          "बहते पानी या जलभराव वाले रास्तों पर गाड़ी न चलाएं।",
          "घर में पानी भरने पर मुख्य बिजली स्विच बंद कर दें।",
          "वेदरजीपीटी / मौसम विभाग के आपातकालीन बुलेटिन सुनते रहें।"
        ],
        emergency_contacts: [
          { name: "राष्ट्रीय आपदा प्रतिक्रिया बल (NDRF)", number: "1078 / 011-24363260" },
          { name: "राज्य आपदा नियंत्रण कक्ष", number: "1070" },
          { name: `जिला आपदा प्रबंधन प्रकोष्ठ (${location})`, number: "020-26123371" },
          { name: "एंबुलेंस आपातकालीन सेवा", number: "108" },
          { name: "पुलिस आपातकालीन सहायता", number: "112" }
        ]
      };
    }
    if (l === 'mr') {
      return {
        title: "पूर व मुसळधार पाऊस सुरक्षा चेकलिस्ट",
        before: [
          "मोबाईल फोन आणि पॉवर बँक १००% चार्ज ठेवा.",
          "महत्त्वाची कागदपत्रे वॉटरप्रूफ बॅगेत सुरक्षित ठेवा.",
          "जवळच्या उंच सुरक्षित निवारा केंद्राची माहिती ठेवा.",
          "किमान ३ दिवसांचे पिण्याचे पाणी व सुका खाऊ साठवून ठेवा."
        ],
        during: [
          "वाहत्या पाण्यातून वाहन चालवणे किंवा चालणे टाळा.",
          "घरात पाणी शिरल्यास मुख्य वीजपुरवठा बंद करा.",
          "वेदरजीपीटी / हवामान विभागाच्या अधिकृत सूचनांचे पालन करा."
        ],
        emergency_contacts: [
          { name: "राष्ट्रीय आपत्ती प्रतिसाद दल (NDRF)", number: "1078 / 011-24363260" },
          { name: "राज्य आपत्ती नियंत्रण कक्ष", number: "1070" },
          { name: `जिल्हा आपत्ती नियंत्रण कक्ष (${location})`, number: "020-26123371" },
          { name: "रुग्णवाहिका आपत्कालीन सेवा", number: "108" },
          { name: "पोलीस आपत्कालीन मदत", number: "112" }
        ]
      };
    }
    return {
      title: "Flood & Heavy Rain Safety Checklist",
      before: [
        "Charge mobile phones and power banks to 100%.",
        "Keep important documents in waterproof sealed bags.",
        "Identify nearest high-ground emergency shelter.",
        "Store at least 3 days of clean drinking water and non-perishable food."
      ],
      during: [
        "Do not walk or drive through moving water streams.",
        "Switch off main electrical breakers if water enters the house.",
        "Stay tuned to official WeatherGPT / IMD emergency broadcasts."
      ],
      emergency_contacts: [
        { name: "National Disaster Response Force (NDRF)", number: "1078 / 011-24363260" },
        { name: "State Disaster Control Room", number: "1070" },
        { name: `District Disaster Cell (${location})`, number: "020-26123371" },
        { name: "Ambulance Emergency", number: "108" },
        { name: "Police Emergency Hotline", number: "112" }
      ]
    };
  };

  const checklist = getLocalizedChecklist(lang);

  useEffect(() => {
    if (!isOpen) return;
    fetch(`${BACKEND_URL}/api/emergency/locations?city=${encodeURIComponent(location || "Pune")}`)
      .then(res => res.json())
      .then(data => {
        if (data.locations) setLocations(data.locations);
      })
      .catch(() => {
        // Fallback verified shelters
        setLocations([
          {
            id: "loc-1",
            name: lang === 'hi' ? "ससून जनरल अस्पताल व इमरजेंसी केयर" : lang === 'mr' ? "ससून जनरल रुग्णालय व आपत्कालीन कक्ष" : "Sassoon General Hospital & Emergency Care",
            category: lang === 'hi' ? "अस्पताल" : lang === 'mr' ? "रुग्णालय" : "Hospital",
            city: "Pune",
            address: "Station Road, Pune Station Area",
            phone: "020-26128000",
            capacity: "500 beds",
            distance_km: "2.4 km"
          },
          {
            id: "loc-2",
            name: lang === 'hi' ? "बालेवाड़ी स्पोर्ट्स कॉम्प्लेक्स शेल्टर" : lang === 'mr' ? "बालेवाडी क्रीडा संकुल निवारा" : "Balewadi Sports Complex Relief Shelter",
            category: lang === 'hi' ? "राहत आश्रयस्थल" : lang === 'mr' ? "मदत निवारा" : "Relief Shelter",
            city: "Pune",
            address: "Mahalunge, Balewadi High Street",
            phone: "020-27372000",
            capacity: "2,500 people",
            distance_km: "8.1 km"
          },
          {
            id: "loc-3",
            name: lang === 'hi' ? "सिविल डिफेंस कमांड सेंटर (शिवाजीनगर)" : lang === 'mr' ? "नागरी संरक्षण नियंत्रण केंद्र (शिवाजीनगर)" : "Civil Defence Command Post (Shivajinagar)",
            category: lang === 'hi' ? "नियंत्रण केंद्र" : lang === 'mr' ? "नियंत्रण कक्ष" : "Command Post",
            city: "Pune",
            address: "Near District Court, Shivajinagar",
            phone: "020-25536300",
            capacity: "Tactical Hub",
            distance_km: "3.2 km"
          }
        ]);
      });
  }, [isOpen, lang]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-3xl rounded-2xl border border-emerald-500/30 bg-slate-900 text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/20 p-2.5 text-emerald-400 border border-emerald-500/30">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-black text-lg text-slate-100">
                  {t.em_modal_title}
                </h2>
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <HeartHandshake className="h-3 w-3" />
                  {t.badge_safety_dir}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{t.em_modal_sub}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-6 pt-3 gap-6">
          <button
            onClick={() => setActiveTab('shelters')}
            className={`pb-3 text-xs font-black flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'shelters' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="h-4 w-4" />
            {t.em_tab_shelters}
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`pb-3 text-xs font-black flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'checklist' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckSquare className="h-4 w-4" />
            {t.em_tab_checklist}
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`pb-3 text-xs font-black flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'contacts' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PhoneCall className="h-4 w-4" />
            {t.em_tab_contacts}
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'shelters' && (
            <div className="space-y-4">
              <div className="grid gap-3">
                {locations.map((loc) => (
                  <div key={loc.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-100 text-sm">{loc.name}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                          {loc.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-500" />
                        {loc.address} ({loc.distance_km})
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">
                        {t.em_col_capacity}: <span className="font-bold text-slate-200">{loc.capacity}</span>
                      </p>
                    </div>
                    <a
                      href={`tel:${loc.phone}`}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm self-stretch sm:self-auto justify-center"
                    >
                      <PhoneCall className="h-3.5 w-3.5" />
                      {loc.phone}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-950/20">
                <h4 className="font-black text-blue-400 text-sm mb-1">{checklist.title}</h4>
                <p className="text-xs text-slate-300">Hazard Focus: {hazard.toUpperCase()}</p>
              </div>

              <div>
                <h5 className="text-xs font-black text-slate-200 mb-2">{t.em_checklist_before}</h5>
                <div className="space-y-2">
                  {checklist.before.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                      <div className="h-4 w-4 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold mt-0.5">✓</div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h5 className="text-xs font-black text-slate-200 mb-2">{t.em_checklist_during}</h5>
                <div className="space-y-2">
                  {checklist.during.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 bg-slate-950/40 p-3 rounded-lg border border-slate-800">
                      <div className="h-4 w-4 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold mt-0.5">!</div>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contacts' && (
            <div className="space-y-3">
              {checklist.emergency_contacts.map((contact, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex justify-between items-center shadow-sm">
                  <div>
                    <h4 className="font-bold text-slate-200 text-xs">{contact.name}</h4>
                    <p className="text-sm font-black text-amber-400 mt-0.5">{contact.number}</p>
                  </div>
                  <a
                    href={`tel:${contact.number.split('/')[0].trim()}`}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5 transition border border-slate-700"
                  >
                    <PhoneCall className="h-3.5 w-3.5 text-emerald-400" />
                    {t.em_call_now}
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 bg-slate-950/80 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition cursor-pointer"
          >
            {t.close_btn}
          </button>
        </div>
      </div>
    </div>
  );
}
