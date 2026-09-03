// Comprehensive i18n localization dictionary for WeatherGPT
// Supports English (en), Hindi (hi), and Marathi (mr)

export type SupportedLanguage = 'en' | 'hi' | 'mr';

export const LOCALIZATION = {
  en: {
    // Header & Meta
    app_title: "WeatherGPT",
    tagline: "Understand the weather. Predict the risk. Take action.",
    placeholder_search: "Search location (e.g., Pune, Mumbai, Nashik)...",
    placeholder_chat: "Ask WeatherGPT about weather, travel safety, or crop advisory...",
    status_online: "Online",
    status_offline: "Offline Mode",
    login_guest: "Login / Guest",
    guest_tag: "Guest",
    gps_location: "GPS Location",

    // Navigation Tabs
    nav_dashboard: "Dashboard",
    nav_map: "Live Map",
    nav_route: "Route Intel",
    nav_alerts: "Official Alerts",
    nav_disaster: "Command Center",
    nav_settings: "Settings",

    // Persona Mode Pills
    mode_general: "General Public",
    mode_traveller: "Traveller",
    mode_farmer: "Farmer Mode",
    mode_disaster: "Disaster Control",
    mode_school: "School/College",
    mode_pill_public: "👤 Public",
    mode_pill_farmer: "🌾 Farmer",
    mode_pill_traveller: "🚗 Traveller",
    mode_pill_school: "🏫 School",
    mode_pill_disaster: "🚨 Disaster",

    // Mode Advisory Headers
    active_operating_mode: "Active Operating Mode & Persona Advisory",
    mode_title_farmer: "🌾 Agro-Meteorological Advisory (Farmer Mode)",
    mode_title_traveller: "🚗 Highway & Route Safety Advisory (Traveller Mode)",
    mode_title_school: "🏫 Campus & Outdoor Activity Advisory (School/College Mode)",
    mode_title_disaster: "🚨 Disaster Operations Directive (Command Mode)",
    mode_title_general: "👤 General Public Weather Advisory",

    // Farmer Mode
    farmer_irrigation_title: "💧 Irrigation Advisory",
    farmer_irrigation_desc: "Delay artificial field irrigation for 48 hours to prevent soil waterlogging.",
    farmer_spraying_title: "🧪 Spraying & Fertilizers",
    farmer_spraying_desc: "Avoid chemical pesticide spraying today; anticipated rain showers will wash off treatments.",
    farmer_produce_title: "🌾 Produce Protection",
    farmer_produce_desc: "Move harvested crops to elevated covered sheds. Verify drainage channels around crop fields.",

    // Traveller Mode
    traveller_vis_title: "🛣️ Highway Visibility",
    traveller_vis_desc: "Expect dense mist and fog patches in ghat corridors (Lonavala/Khandala).",
    traveller_hydro_title: "🚘 Hydroplaning Watch",
    traveller_hydro_desc: "Wind velocity high with active rain. Reduce speed on wet asphalt curves.",
    traveller_hours_title: "⏰ Recommended Driving Hours",
    traveller_hours_desc: "Optimal departure window: 6:00 AM to 11:00 AM before heavy afternoon cloudburst build-up.",

    // School Mode
    school_sports_title: "⚽ Sports & PE Safety",
    school_sports_desc: "Physical education and outdoor ground activities should be moved indoors after 1:00 PM.",
    school_lightning_title: "⚡ Lightning Risk Index",
    school_lightning_desc: "Cloud-to-ground convective lightning hazard elevated during afternoon hours. Keep students indoors.",
    school_bus_title: "🚌 Bus Fleet Transit",
    school_bus_desc: "Coordinate evening dismissal routes early to avoid urban waterlogging hotspots along main arterial roads.",

    // Disaster Mode
    disaster_river_title: "🌊 River & Spillway Level",
    disaster_river_desc: "Khadakwasla Dam spillway discharge monitored. Low-lying riverbank settlements put on watch.",
    disaster_rescue_title: "🚒 Emergency Deployment",
    disaster_rescue_desc: "NDRF 5th Battalion rescue teams alerted. Rubber rescue boats positioned at high-risk transit hubs.",
    disaster_public_title: "📢 Public Directive",
    disaster_public_desc: "Issue red alert public notifications for low-lying urban inundation zones. Evacuate basement structures.",

    general_rec_prefix: "💡 General Recommendation:",

    // Current Weather Parameters
    source: "Source",
    feels_like: "Feels Like",
    humidity: "Humidity",
    wind: "Wind",
    precipitation: "Precipitation",
    atm_pressure: "Atm Pressure",
    visibility: "Visibility",
    uv_index: "UV Index",
    air_quality: "Air Quality",

    // Forecast & Trends
    label_forecast: "7-Day Forecast",
    day_details: "Day Details",
    ai_advice: "AI Advice:",
    rain_prob: "Rain Prob",
    trend_title: "7-Day Meteorological Trend",
    trend_subtitle: "Interactive forecast analytics & precipitation variance",
    tab_precipitation: "Precipitation (%)",
    tab_temperature: "Temperature (°C)",

    // Risk Engine
    label_risk: "Weather Risk Score",
    label_why: "Why This Risk?",
    label_recommendations: "AI Recommended Actions",
    no_risk_indicators: "No high-risk indicators active.",
    contributing_factors: "Key Risk Contributing Factors",
    factor_weight: "Weight",
    factor_impact: "Impact Level",
    topography_context: "Topographical Vulnerability",

    // Alerts & Warnings
    no_active_warnings: "No Active Weather Warnings",
    clear_area_msg: "Current area is classified as clear by meteorological alerts.",
    active_bulletins: "Active Meteorological Warning Bulletins",
    active_bulletins_sub: "Authorized alerts published by India Meteorological Department (IMD) warning cells.",
    official_source: "Official IMD Alert",
    recommended_precautions: "Recommended Precautions",

    // Route Intel
    btn_travel: "Analyze Route",
    route_planning: "Smart Weather Corridor Analysis",
    route_planning_sub: "Real-time waypoint weather, landslide watches & ghat corridor intelligence",
    from_city: "Starting Location",
    to_city: "Destination Location",
    analyzing_route: "Analyzing Corridors...",
    travel_guidance: "AI Highway Travel Advisory",
    waypoint_timeline: "Waypoint Weather Timeline",

    // Command Center
    command_center_title: "Disaster Emergency Command Center",
    command_center_sub: "Consolidated multi-hazard situational awareness & response orchestration",
    metric_active_alerts: "Active Warnings",
    metric_critical_zones: "High-Risk Zones",
    metric_flood_hotspots: "Flood Hotspots",
    metric_heavy_rain: "Heavy Rain Zones",
    situation_briefing: "AI Tactical Situation Briefing",
    priority_zones: "Priority Response Zones",

    // Advanced Tools Sidebar
    advanced_tools: "Advanced Analytics & Tools",
    disaster_sim: "Disaster Simulator",
    emergency_center: "Emergency Center",
    climate_insights: "Climate Insights",
    export_report: "Export Report",

    // Modals Common
    badge_advanced_ai: "ADVANCED AI SIMULATION",
    badge_safety_dir: "SAFETY DIRECTORY",
    badge_climate_analytics: "CLIMATE ANALYTICS",
    badge_exec_report: "EXECUTIVE SUITE",
    close_btn: "Close",

    // Disaster Simulator Modal
    sim_modal_title: "Disaster & What-If Weather Simulator",
    sim_modal_sub: "Simulate extreme weather events or run hypothetical parameter changes",
    sim_tab_preset: "Disaster Scenario Presets",
    sim_tab_whatif: "What-If Parameter Calculator",
    sim_select_scenario: "Select Emergency Scenario:",
    sim_scenario_rain: "🌧️ Heavy Rain",
    sim_scenario_flood: "🌊 Flood",
    sim_scenario_heatwave: "🔥 Heatwave",
    sim_scenario_cyclone: "🌀 Cyclone",
    sim_scenario_thunder: "⚡ Thunderstorm",
    sim_affected_zones: "Affected High-Risk Zones:",
    sim_ai_rec: "🤖 AI Emergency Recommendation:",
    sim_rain_increase: "Rainfall Increase (%):",
    sim_temp_shift: "Temperature Shift (°C):",
    sim_wind_surge: "Wind Velocity Surge (km/h):",
    sim_hypo_risk: "Calculated Hypothetical Risk",
    sim_hypo_desc: "Estimated risk score assuming specified atmospheric shifts occur over Western Ghats.",

    // Emergency Center Modal
    em_modal_title: "Emergency Safe Zones & Relief Centers",
    em_modal_sub: "Locate verified shelters, disaster hotlines, and standard operating checklists",
    em_tab_shelters: "Verified Safe Shelters",
    em_tab_checklist: "Safety Checklist",
    em_tab_contacts: "Emergency Helplines",
    em_col_name: "Facility / Shelter Name",
    em_col_category: "Category",
    em_col_distance: "Distance",
    em_col_capacity: "Capacity",
    em_col_contact: "Contact",
    em_checklist_before: "Before Event (Preparedness):",
    em_checklist_during: "During Event (Immediate Response):",
    em_call_now: "Call Hotline",

    // Climate Insights Modal
    climate_modal_title: "Long-Term Climate Trends & Decadal Insights",
    climate_modal_sub: "Historical precipitation patterns, thermal shifts, and anomaly detection",
    climate_baseline: "Historical Climate Baseline",
    climate_avg_temp: "Historical Avg Temp",
    climate_avg_rain: "Annual Baseline Rainfall",
    climate_monthly_avg: "12-Month Historical Climatology",
    climate_month: "Month",
    climate_temp: "Avg Temp (°C)",
    climate_rain: "Rainfall (mm)",
    climate_anomaly_title: "Decadal Climate Shift & Anomalies",

    // Report Generator Modal
    report_modal_title: "Weather Intelligence Report Generator",
    report_modal_sub: "Export structured executive bulletins and advisories for decision-makers",
    report_type_label: "Select Report Type:",
    report_type_daily: "Daily Weather Briefing",
    report_type_weekly: "Weekly Agricultural & Weather Outlook",
    report_type_disaster: "Emergency Disaster Situation Report",
    report_generate_btn: "Generate Report",
    report_generating: "Compiling Intelligence...",
    report_export_as: "Export Report Document:",
    report_summary: "Executive Summary",
    report_recommendations: "Actionable Directives",

    // Auth & Login
    auth_signin_title: "Sign In to WeatherGPT",
    auth_signin_sub: "Access personalized meteorology advisories & real-time risk intelligence",
    auth_register_title: "Create WeatherGPT Account",
    auth_register_sub: "Tailor weather risk engine to your specific operational persona",
    auth_tab_signin: "Sign In",
    auth_tab_register: "Register",
    auth_tab_guest: "1-Click Guest",
    auth_email_label: "Email Address",
    auth_password_label: "Password",
    auth_name_label: "Full Name / Organization",
    auth_role_label: "Select Your Operational Persona:",
    auth_btn_signin: "Sign In to Account",
    auth_btn_register: "Create Free Account",
    auth_btn_guest: "Continue as Guest Explorer",
    auth_back_to_dashboard: "← Back to Live Dashboard",
    auth_dont_have_account: "Don't have an account?",
    auth_already_have_account: "Already have an account?",
    auth_signing_in: "Signing in...",
    auth_creating_account: "Creating account...",

    // Disclaimer
    disclaimer: "WeatherGPT provides AI-assisted insights based on available weather feeds. For emergencies, always follow instructions from authorized government and emergency management authorities."
  },

  hi: {
    // Header & Meta
    app_title: "वेदरजीपीटी",
    tagline: "मौसम समझें। जोखिम का आकलन करें। कार्रवाई करें।",
    placeholder_search: "स्थान खोजें (जैसे पुणे, मुंबई, नासिक)...",
    placeholder_chat: "मौसम, यात्रा सुरक्षा या फसल संबंधी सलाह के बारे में पूछें...",
    status_online: "ऑनलाइन",
    status_offline: "ऑफ़लाइन मोड",
    login_guest: "लॉगिन / अतिथि",
    guest_tag: "अतिथि",
    gps_location: "जीपीएस स्थान",

    // Navigation Tabs
    nav_dashboard: "डैशबोर्ड",
    nav_map: "लाइव नक्शा",
    nav_route: "मार्ग सुरक्षा",
    nav_alerts: "आधिकारिक अलर्ट",
    nav_disaster: "नियंत्रण केंद्र",
    nav_settings: "सेटिंग्स",

    // Persona Mode Pills
    mode_general: "सामान्य जनता",
    mode_traveller: "यात्री",
    mode_farmer: "किसान मोड",
    mode_disaster: "आपदा प्रबंधन",
    mode_school: "स्कूल/कॉलेज",
    mode_pill_public: "👤 आम जनता",
    mode_pill_farmer: "🌾 किसान",
    mode_pill_traveller: "🚗 यात्री",
    mode_pill_school: "🏫 स्कूल",
    mode_pill_disaster: "🚨 आपदा",

    // Mode Advisory Headers
    active_operating_mode: "सक्रिय कार्य मोड एवं सलाह",
    mode_title_farmer: "🌾 कृषि-मौसम परामर्श (किसान मोड)",
    mode_title_traveller: "🚗 राजमार्ग व मार्ग सुरक्षा परामर्श (यात्री मोड)",
    mode_title_school: "🏫 परिसर व बाहरी गतिविधि सलाह (स्कूल/कॉलेज मोड)",
    mode_title_disaster: "🚨 आपदा संचालन निर्देश (कमांड मोड)",
    mode_title_general: "👤 सामान्य जनता मौसम सलाह",

    // Farmer Mode
    farmer_irrigation_title: "💧 सिंचाई सलाह",
    farmer_irrigation_desc: "खेत में जलभराव रोकने के लिए अगले 48 घंटों तक सिंचाई टालें।",
    farmer_spraying_title: "🧪 छिड़काव और उर्वरक",
    farmer_spraying_desc: "आज रासायनिक कीटनाशकों के छिड़काव से बचें; बारिश से दवा धुल जाएगी।",
    farmer_produce_title: "🌾 फसल सुरक्षा",
    farmer_produce_desc: "कटी हुई फसलों को ढके हुए शेड में रखें और जल निकासी की जांच करें।",

    // Traveller Mode
    traveller_vis_title: "🛣️ राजमार्ग दृश्यता",
    traveller_vis_desc: "घाट क्षेत्रों (लोनावाला/खंडाला) में घने कोहरे की उम्मीद है।",
    traveller_hydro_title: "🚘 स्लिप / फिसलने का खतरा",
    traveller_hydro_desc: "तेज हवा और बारिश के दौरान गीली सड़कों व मोड़ों पर वाहन की गति धीमी रखें।",
    traveller_hours_title: "⏰ अनुशंसित यात्रा समय",
    traveller_hours_desc: "उत्तम यात्रा समय: दोपहर की भारी बारिश से पहले सुबह 6:00 बजे से 11:00 बजे तक।",

    // School Mode
    school_sports_title: "⚽ खेल व शारीरिक सुरक्षा",
    school_sports_desc: "दोपहर 1:00 बजे के बाद खेलकूद और बाहरी गतिविधियों को हॉल के अंदर रखें।",
    school_lightning_title: "⚡ बिजली गिरने का जोखिम",
    school_lightning_desc: "दोपहर में बिजली गिरने का खतरा अधिक है। छात्रों को परिसर के अंदर रखें।",
    school_bus_title: "🚌 स्कूल बस परिवहन",
    school_bus_desc: "जलभराव से बचने के लिए शाम की छुट्टी के बस रूट समय से पहले व्यवस्थित करें।",

    // Disaster Mode
    disaster_river_title: "🌊 नदी व बांध जलस्तर",
    disaster_river_desc: "खड़कवासला बांध के डिस्चार्ज पर नज़र रखी जा रही है। तटीय बस्तियां अलर्ट पर हैं।",
    disaster_rescue_title: "🚒 आपातकालीन तैनाती",
    disaster_rescue_desc: "NDRF 5वीं बटालियन बचाव दल सतर्क है। रबर नावें उच्च जोखिम क्षेत्रों में तैनात हैं।",
    disaster_public_title: "📢 सार्वजनिक निर्देश",
    disaster_public_desc: "निचले क्षेत्रों के लिए रेड अलर्ट जारी करें। बेसमेंट खाली कराएं।",

    general_rec_prefix: "💡 सामान्य सलाह:",

    // Current Weather Parameters
    source: "स्रोत",
    feels_like: "अनुभूत तापमान",
    humidity: "नमी",
    wind: "हवा",
    precipitation: "वर्षा संभावना",
    atm_pressure: "वायु दबाव",
    visibility: "दृश्यता",
    uv_index: "यूवी इंडेक्स",
    air_quality: "वायु गुणवत्ता",

    // Forecast & Trends
    label_forecast: "7-दिवसीय पूर्वानुमान",
    day_details: "दिन का विवरण",
    ai_advice: "एआई सलाह:",
    rain_prob: "बारिश संभावना",
    trend_title: "7-दिवसीय मौसम रुझान",
    trend_subtitle: "इंटरैक्टिव पूर्वानुमान विश्लेषण व वर्षा भिन्नता",
    tab_precipitation: "वर्षा (%)",
    tab_temperature: "तापमान (°C)",

    // Risk Engine
    label_risk: "मौसम जोखिम स्कोर",
    label_why: "यह जोखिम क्यों?",
    label_recommendations: "एआई अनुशंसित कार्रवाइयां",
    no_risk_indicators: "कोई उच्च जोखिम संकेतक सक्रिय नहीं है।",
    contributing_factors: "प्रमुख जोखिम योगदान कारक",
    factor_weight: "भार",
    factor_impact: "प्रभाव स्तर",
    topography_context: "स्थलाकृतिक संवेदनशीलता",

    // Alerts & Warnings
    no_active_warnings: "कोई सक्रिय मौसम चेतावनी नहीं",
    clear_area_msg: "वर्तमान क्षेत्र मौसम चेतावनियों से पूर्णतः मुक्त है।",
    active_bulletins: "सक्रिय मौसम चेतावनी बुलेटिन",
    active_bulletins_sub: "भारत मौसम विज्ञान विभाग (IMD) चेतावनी प्रकोष्ठ द्वारा प्रकाशित अधिकृत अलर्ट।",
    official_source: "अधिकृत IMD अलर्ट",
    recommended_precautions: "अनुशंसित सावधानियां",

    // Route Intel
    btn_travel: "मार्ग विश्लेषण करें",
    route_planning: "स्मार्ट मौसम गलियारा विश्लेषण",
    route_planning_sub: "वास्तविक समय वेपॉइंट मौसम, भूस्खलन निगरानी व घाट गलियारा जानकारी",
    from_city: "प्रारंभिक स्थान",
    to_city: "गंतव्य स्थान",
    analyzing_route: "गलियारे का विश्लेषण किया जा रहा है...",
    travel_guidance: "एआई राजमार्ग यात्रा सलाह",
    waypoint_timeline: "वेपॉइंट मौसम समयरेखा",

    // Command Center
    command_center_title: "आपदा आपातकालीन नियंत्रण केंद्र",
    command_center_sub: "समेकित बहु-आपदा स्थितिजन्य जागरूकता व प्रतिक्रिया समन्वय",
    metric_active_alerts: "सक्रिय चेतावनियां",
    metric_critical_zones: "उच्च-जोखिम क्षेत्र",
    metric_flood_hotspots: "बाढ़ संभावित स्थल",
    metric_heavy_rain: "भारी वर्षा क्षेत्र",
    situation_briefing: "एआई रणनीतिक स्थिति विवरण",
    priority_zones: "प्राथमिकता प्रतिक्रिया क्षेत्र",

    // Advanced Tools Sidebar
    advanced_tools: "उन्नत विश्लेषण और उपकरण",
    disaster_sim: "आपदा सिम्युलेटर",
    emergency_center: "आपतकालीन केंद्र",
    climate_insights: "जलवायु अंतर्दृष्टि",
    export_report: "रिपोर्ट निर्यात",

    // Modals Common
    badge_advanced_ai: "उन्नत एआई सिम्युलेशन",
    badge_safety_dir: "सुरक्षा डायरेक्टरी",
    badge_climate_analytics: "जलवायु विश्लेषण",
    badge_exec_report: "कार्यकारी रिपोर्ट",
    close_btn: "बंद करें",

    // Disaster Simulator Modal
    sim_modal_title: "आपदा एवं काल्पनिक मौसम सिम्युलेटर",
    sim_modal_sub: "चरम मौसम घटनाओं का अनुकरण करें या काल्पनिक परिवर्तन देखें",
    sim_tab_preset: "आपदा परिदृश्य प्रीसेट",
    sim_tab_whatif: "काल्पनिक परिस्थिति गणक",
    sim_select_scenario: "आपातकालीन परिदृश्य चुनें:",
    sim_scenario_rain: "🌧️ भारी बारिश",
    sim_scenario_flood: "🌊 बाढ़",
    sim_scenario_heatwave: "🔥 लू / हीटवेव",
    sim_scenario_cyclone: "🌀 चक्रवात / तूफान",
    sim_scenario_thunder: "⚡ गरज के साथ तूफान",
    sim_affected_zones: "प्रभावित उच्च-जोखिम क्षेत्र:",
    sim_ai_rec: "🤖 एआई आपातकालीन सलाह:",
    sim_rain_increase: "वर्षा वृद्धि (%):",
    sim_temp_shift: "तापमान परिवर्तन (°C):",
    sim_wind_surge: "हवा की गति वृद्धि (km/h):",
    sim_hypo_risk: "काल्पनिक अनुमानित जोखिम",
    sim_hypo_desc: "पश्चिमी घाट क्षेत्र में होने वाले संभावित वायुमंडलीय बदलावों के आधार पर जोखिम स्कोर।",

    // Emergency Center Modal
    em_modal_title: "आपत्कालीन सुरक्षित क्षेत्र व राहत केंद्र",
    em_modal_sub: "सत्यापित सुरक्षित आश्रयस्थल, आपदा हेल्पलाइन और सुरक्षा चेकलिस्ट प्राप्त करें",
    em_tab_shelters: "सत्यापित सुरक्षित आश्रयस्थल",
    em_tab_checklist: "सुरक्षा चेकलिस्ट",
    em_tab_contacts: "आपातकालीन हेल्पलाइन",
    em_col_name: "केंद्र / आश्रयस्थल का नाम",
    em_col_category: "श्रेणी",
    em_col_distance: "दूरी",
    em_col_capacity: "क्षमता",
    em_col_contact: "संपर्क",
    em_checklist_before: "आपदा पूर्व तैयारी:",
    em_checklist_during: "आपदा के दौरान तत्काल कदम:",
    em_call_now: "कॉल करें",

    // Climate Insights Modal
    climate_modal_title: "दीर्घकालिक जलवायु रुझान व विश्लेषण",
    climate_modal_sub: "ऐतिहासिक वर्षा पैटर्न, तापीय परिवर्तन और विसंगति का पता लगाना",
    climate_baseline: "ऐतिहासिक जलवायु आधारभूत डेटा",
    climate_avg_temp: "ऐतिहासिक औसत तापमान",
    climate_avg_rain: "वार्षिक आधारभूत वर्षा",
    climate_monthly_avg: "12-माह का ऐतिहासिक जलवायु विज्ञान",
    climate_month: "माह",
    climate_temp: "औसत तापमान (°C)",
    climate_rain: "वर्षा (mm)",
    climate_anomaly_title: "दशकीय जलवायु परिवर्तन व विसंगतियां",

    // Report Generator Modal
    report_modal_title: "मौसम आसूचना रिपोर्ट जनरेटर",
    report_modal_sub: "निर्णयकर्ताओं के लिए संरचित कार्यकारी बुलेटिन और सलाह निर्यात करें",
    report_type_label: "रिपोर्ट का प्रकार चुनें:",
    report_type_daily: "दैनिक मौसम बुलेटिन",
    report_type_weekly: "साप्ताहिक कृषि व मौसम दृष्टिकोण",
    report_type_disaster: "आपातकालीन आपदा स्थिति रिपोर्ट",
    report_generate_btn: "रिपोर्ट तैयार करें",
    report_generating: "डेटा संकलित हो रहा है...",
    report_export_as: "रिपोर्ट दस्तावेज डाउनलोड करें:",
    report_summary: "कार्यकारी सारांश",
    report_recommendations: "कार्रवाई योग्य निर्देश",

    // Auth & Login
    auth_signin_title: "वेदरजीपीटी में साइन इन करें",
    auth_signin_sub: "व्यक्तिगत मौसम सलाह और वास्तविक समय जोखिम चेतावनी प्राप्त करें",
    auth_register_title: "वेदरजीपीटी खाता बनाएं",
    auth_register_sub: "मौसम जोखिम इंजन को अपने विशिष्ट कार्य प्रोफ़ाइल के अनुसार सेट करें",
    auth_tab_signin: "साइन इन",
    auth_tab_register: "पंजीकरण",
    auth_tab_guest: "1-क्लिक अतिथि",
    auth_email_label: "ईमेल पता",
    auth_password_label: "पासवर्ड",
    auth_name_label: "पूरा नाम / संगठन",
    auth_role_label: "अपनी कार्यकारी प्रोफ़ाइल चुनें:",
    auth_btn_signin: "खाते में साइन इन करें",
    auth_btn_register: "निःशुल्क खाता बनाएं",
    auth_btn_guest: "अतिथि के रूप में जारी रखें",
    auth_back_to_dashboard: "← मुख्य डैशबोर्ड पर लौटें",
    auth_dont_have_account: "क्या आपका खाता नहीं है?",
    auth_already_have_account: "पहले से खाता है?",
    auth_signing_in: "साइन इन हो रहा है...",
    auth_creating_account: "खाता बनाया जा रहा है...",

    // Disclaimer
    disclaimer: "वेदरजीपीटी उपलब्ध डेटा के आधार पर एआई-जनरेटेड इनसाइट्स प्रदान करता है। आपातकालीन स्थितियों में हमेशा आधिकारिक सरकारी निर्देशों का पालन करें।"
  },

  mr: {
    // Header & Meta
    app_title: "वेदरजीपीटी",
    tagline: "हवामान समजून घ्या. जोखमीचा अंदाज लावा. कृती करा.",
    placeholder_search: "ठिकाण शोधा (उदा. पुणे, मुंबई, नाशिक)...",
    placeholder_chat: "हवामान, प्रवास सुरक्षितता किंवा पीक सल्ल्याबद्दल विचारा...",
    status_online: "ऑनलाइन",
    status_offline: "ऑफलाईन मोड",
    login_guest: "लॉगिन / पाहुणे",
    guest_tag: "पाहुणे",
    gps_location: "जीपीएस स्थान",

    // Navigation Tabs
    nav_dashboard: "डॅशबोर्ड",
    nav_map: "थेट नकाशा",
    nav_route: "मार्ग सुरक्षितता",
    nav_alerts: "अधिकृत इशारे",
    nav_disaster: "नियंत्रण केंद्र",
    nav_settings: "सेटिंग्ज",

    // Persona Mode Pills
    mode_general: "सामान्य नागरिक",
    mode_traveller: "प्रवासी मोड",
    mode_farmer: "शेतकरी मोड",
    mode_disaster: "आपत्ती नियंत्रण",
    mode_school: "शाळा/कॉलेज",
    mode_pill_public: "👤 नागरिक",
    mode_pill_farmer: "🌾 शेतकरी",
    mode_pill_traveller: "🚗 प्रवासी",
    mode_pill_school: "🏫 शाळा",
    mode_pill_disaster: "🚨 आपत्ती",

    // Mode Advisory Headers
    active_operating_mode: "सक्रिय कार्य मोड व सल्ला",
    mode_title_farmer: "🌾 शेती-हवामान सल्ला (शेतकरी मोड)",
    mode_title_traveller: "🚗 महामार्ग व प्रवास सुरक्षितता (प्रवासी मोड)",
    mode_title_school: "🏫 परिसर व मैदानी उपक्रम सल्ला (शाळा/कॉलेज)",
    mode_title_disaster: "🚨 आपत्ती व्यवस्थापन निर्देश (कमांड मोड)",
    mode_title_general: "👤 सामान्य नागरिक हवामान सल्ला",

    // Farmer Mode
    farmer_irrigation_title: "💧 सिंचन सल्ला",
    farmer_irrigation_desc: "शेतात पाणी साचू नये म्हणून पुढील 48 तास सिंचन पुढे ढकला.",
    farmer_spraying_title: "🧪 फवारणी व खते",
    farmer_spraying_desc: "आज रासायनिक कीटकनाशक फवारणी टाळा; पावसाने औषध वाहून जाईल.",
    farmer_produce_title: "🌾 पीक संरक्षण",
    farmer_produce_desc: "काढणी केलेले पीक सुरक्षित शेडमध्ये ठेवा व पाण्याचा निचरा तपासा.",

    // Traveller Mode
    traveller_vis_title: "🛣️ महामार्ग दृश्यमानता",
    traveller_vis_desc: "घाट परिसरात (लोणावळा/खंडाळा) दाट धुक्याची शक्यता आहे.",
    traveller_hydro_title: "🚘 घसरगुंडी धोका",
    traveller_hydro_desc: "वादळी व ओल्या रस्त्यांवर वाहनाचा वेग कमी ठेवा.",
    traveller_hours_title: "⏰ प्रवासाची योग्य वेळ",
    traveller_hours_desc: "योग्य वेळ: दुपारी मुसळधार पावसापूर्वी सकाळी 6:00 ते 11:00.",

    // School Mode
    school_sports_title: "⚽ मैदानी उपक्रम सुरक्षा",
    school_sports_desc: "दुपारी 1:00 नंतर मैदानी खेळ हॉलमध्ये घ्या.",
    school_lightning_title: "⚡ वीज पडण्याचा धोका",
    school_lightning_desc: "दुपारी विजांचा धोका जास्त आहे. विद्यार्थ्यांना वर्गात ठेवा.",
    school_bus_title: "🚌 शाळा बस वाहतूक",
    school_bus_desc: "पाणी साचण्यापूर्वी संध्याकाळचे बस मार्ग वेळेआधी नियोजन करा.",

    // Disaster Mode
    disaster_river_title: "🌊 नदी व धरण पातळी",
    disaster_river_desc: "खडकवासला धरणातून सोडणाऱ्या पाण्यावर लक्ष ठेवले आहे.",
    disaster_rescue_title: "🚒 आपत्कालीन पथक",
    disaster_rescue_desc: "NDRF 5वी बटालियन बचाव पथक सतर्क आहे. रबरी बोटी तैनात आहेत.",
    disaster_public_title: "📢 सार्वजनिक निर्देश",
    disaster_public_desc: "सखल भागांसाठी रेड अलर्ट जारी करा. तळघरे रिकामी करा.",

    general_rec_prefix: "💡 सामान्य सल्ला:",

    // Current Weather Parameters
    source: "स्रोत",
    feels_like: "जाणवणारा तापमान",
    humidity: "आर्द्रता",
    wind: "वारा",
    precipitation: "पावसाची शक्यता",
    atm_pressure: "हवेचा दाब",
    visibility: "दृश्यमानता",
    uv_index: "युव्ही इंडेक्स",
    air_quality: "हवेची गुणवत्ता",

    // Forecast & Trends
    label_forecast: "7-दिवसांचा अंदाज",
    day_details: "दिवसाचा तपशील",
    ai_advice: "एआय सल्ला:",
    rain_prob: "पावसाची शक्यता",
    trend_title: "7-दिवसीय हवामान कल",
    trend_subtitle: "परस्परसंवादी अंदाज विश्लेषण व पाऊस भिन्नता",
    tab_precipitation: "पाऊस (%)",
    tab_temperature: "तापमान (°C)",

    // Risk Engine
    label_risk: "हवामान जोखीम गुण",
    label_why: "हा धोका का आहे?",
    label_recommendations: "एआय शिफारसी",
    no_risk_indicators: "कोणतेही उच्च जोखीम निर्देशक सक्रिय नाहीत.",
    contributing_factors: "मुख्य जोखीम घटक",
    factor_weight: "भार",
    factor_impact: "प्रभाव पातळी",
    topography_context: "भौगोलिक असुरक्षितता",

    // Alerts & Warnings
    no_active_warnings: "कोणतीही सक्रिय हवामान चेतावणी नाही",
    clear_area_msg: "सद्य परिसर हवामान इशाऱ्यांपासून पूर्णपणे मुक्त आहे.",
    active_bulletins: "सक्रिय हवामान चेतावणी बुलेटिन",
    active_bulletins_sub: "भारतीय हवामान विभाग (IMD) चेतावणी कक्षाने जारी केलेले अधिकृत इशारे.",
    official_source: "अधिकृत IMD इशारा",
    recommended_precautions: "शिफारस केलेल्या खबरदारी",

    // Route Intel
    btn_travel: "मार्ग विश्लेषण करा",
    route_planning: "स्मार्ट हवामान कॉरिडोअर विश्लेषण",
    route_planning_sub: "थेट वेपॉइंट हवामान, दरड कोसळण्याची दक्षता व घाट कॉरिडोअर माहिती",
    from_city: "प्रारंभिक ठिकाण",
    to_city: "गंतव्य ठिकाण",
    analyzing_route: "कॉरिडोअरचे विश्लेषण करत आहे...",
    travel_guidance: "एआय महामार्ग प्रवास सल्ला",
    waypoint_timeline: "वेपॉइंट हवामान टाइमलाइन",

    // Command Center
    command_center_title: "आपत्ती आपत्कालीन नियंत्रण केंद्र",
    command_center_sub: "एकात्मिक बहु-आपत्ती परिस्थिती जाणीव व प्रतिसाद समन्वय",
    metric_active_alerts: "सक्रिय इशारे",
    metric_critical_zones: "उच्च-धोका क्षेत्र",
    metric_flood_hotspots: "पूर प्रवण क्षेत्र",
    metric_heavy_rain: "मुसळधार पाऊस क्षेत्र",
    situation_briefing: "एआय सामरिक परिस्थिती अहवाल",
    priority_zones: "प्राधान्य प्रतिसाद क्षेत्र",

    // Advanced Tools Sidebar
    advanced_tools: "प्रगत विश्लेषण व साधने",
    disaster_sim: "आपत्ती सिम्युलेटर",
    emergency_center: "आपत्कालीन केंद्र",
    climate_insights: "हवामान अंतर्दृष्टी",
    export_report: "अहवाल निर्यात",

    // Modals Common
    badge_advanced_ai: "प्रगत एआय सिम्युलेशन",
    badge_safety_dir: "सुरक्षा निर्देशिका",
    badge_climate_analytics: "हवामान विश्लेषण",
    badge_exec_report: "कार्यकारी अहवाल",
    close_btn: "बंद करा",

    // Disaster Simulator Modal
    sim_modal_title: "आपत्ती व काल्पनिक हवामान सिम्युलेटर",
    sim_modal_sub: "अतिवृष्टी किंवा हवामान बदलांचे काल्पनिक अंदाज पहा",
    sim_tab_preset: "आपत्ती परिस्थिती प्रीसेट",
    sim_tab_whatif: "काल्पनिक स्थिती गणक",
    sim_select_scenario: "आपत्कालीन परिस्थिती निवडा:",
    sim_scenario_rain: "🌧️ मुसळधार पाऊस",
    sim_scenario_flood: "🌊 पूर",
    sim_scenario_heatwave: "🔥 उष्णतेची लाट",
    sim_scenario_cyclone: "🌀 चक्रीवादळ",
    sim_scenario_thunder: "⚡ वादळी पाऊस",
    sim_affected_zones: "प्रभावित उच्च-धोका क्षेत्र:",
    sim_ai_rec: "🤖 एआय आपत्कालीन शिफारस:",
    sim_rain_increase: "पावसातील वाढ (%):",
    sim_temp_shift: "तापमानातील बदल (°C):",
    sim_wind_surge: "वाऱ्याचा वेग वाढ (km/h):",
    sim_hypo_risk: "काल्पनिक अंदाजित जोखीम",
    sim_hypo_desc: "पश्चिम घाट परिसरात संभाव्य वातावरणीय बदलांवर आधारित अंदाजित जोखीम गुण.",

    // Emergency Center Modal
    em_modal_title: "आपत्कालीन सुरक्षित क्षेत्र व मदत केंद्र",
    em_modal_sub: "सत्यापित सुरक्षित निवारा, आपत्ती हेल्पलाईन आणि सुरक्षा चेकलिस्ट मिळवा",
    em_tab_shelters: "सत्यापित सुरक्षित निवारा",
    em_tab_checklist: "सुरक्षा चेकलिस्ट",
    em_tab_contacts: "आपत्कालीन हेल्पलाईन",
    em_col_name: "केंद्र / निवाऱ्याचे नाव",
    em_col_category: "श्रेणी",
    em_col_distance: "अंतर",
    em_col_capacity: "क्षमता",
    em_col_contact: "संपर्क",
    em_checklist_before: "आपत्तीपूर्वी तयारी:",
    em_checklist_during: "आपत्तीदरम्यान तत्काळ कृती:",
    em_call_now: "कॉल करा",

    // Climate Insights Modal
    climate_modal_title: "दीर्घकालीन हवामान कल व विश्लेषण",
    climate_modal_sub: "ऐतिहासिक पावसाचे स्वरूप, तापमान बदल आणि विसंगतींचा शोध",
    climate_baseline: "ऐतिहासिक हवामान आधारभूत डेटा",
    climate_avg_temp: "ऐतिहासिक सरासरी तापमान",
    climate_avg_rain: "वार्षिक आधारभूत पाऊस",
    climate_monthly_avg: "12 महिन्यांचे ऐतिहासिक हवामानशास्त्र",
    climate_month: "महिना",
    climate_temp: "सरासरी तापमान (°C)",
    climate_rain: "पाऊस (mm)",
    climate_anomaly_title: "दशकीय हवामान बदल व विसंगती",

    // Report Generator Modal
    report_modal_title: "हवामान गुप्तवार्ता अहवाल जनरेटर",
    report_modal_sub: "निर्णयकर्त्यांसाठी संरचित कार्यकारी बुलेटिन आणि शिफारसी निर्यात करा",
    report_type_label: "अहवाल प्रकार निवडा:",
    report_type_daily: "दैनिक हवामान बुलेटिन",
    report_type_weekly: "साप्ताहिक शेती व हवामान दृष्टिकोन",
    report_type_disaster: "आपत्कालीन आपत्ती परिस्थिती अहवाल",
    report_generate_btn: "अहवाल तयार करा",
    report_generating: "माहिती संकलित केली जात आहे...",
    report_export_as: "अहवाल दस्तऐवज डाउनलोड करा:",
    report_summary: "कार्यकारी सारांश",
    report_recommendations: "कृतीयोग्य निर्देश",

    // Auth & Login
    auth_signin_title: "वेदरजीपीटी मध्ये साइन इन करा",
    auth_signin_sub: "वैयक्तिकृत हवामान सल्ला व थेट जोखीम इशारे मिळवा",
    auth_register_title: "वेदरजीपीटी खाते तयार करा",
    auth_register_sub: "हवामान जोखीम प्रणाली आपल्या कार्य प्रोफाइलनुसार जुळवा",
    auth_tab_signin: "साइन इन",
    auth_tab_register: "नोंदणी करा",
    auth_tab_guest: "१-क्लिक पाहुणे",
    auth_email_label: "ईमेल पत्ता",
    auth_password_label: "पासवर्ड",
    auth_name_label: "पूर्ण नाव / संस्था",
    auth_role_label: "आपली कार्यकारी प्रोफाइल निवडा:",
    auth_btn_signin: "खात्यात साइन इन करा",
    auth_btn_register: "विनामूल्य खाते तयार करा",
    auth_btn_guest: "पाहुणे म्हणून पुढे जा",
    auth_back_to_dashboard: "← मुख्य डॅशबोर्डवर परत जा",
    auth_dont_have_account: "खाते नाही का?",
    auth_already_have_account: "आधीच खाते आहे का?",
    auth_signing_in: "साइन इन होत आहे...",
    auth_creating_account: "खाते तयार होत आहे...",

    // Disclaimer
    disclaimer: "वेदरजीपीटी उपलब्ध डेटाच्या आधारे एआय-जनरेटेड इनसाइट्स प्रदान करते. आपत्कालीन परिस्थितीत नेहमी अधिकृत सरकारी सूचनांचे पालन करा."
  }
};

// Helper function to translate condition strings
export const translateCondition = (condition: string, lang: SupportedLanguage): string => {
  if (!condition) return "";
  const dictHi: Record<string, string> = {
    "Clear": "साफ मौसम",
    "Sunny": "धूप",
    "Clouds": "बादल",
    "Partly Cloudy": "खंडित बादल",
    "Mostly Cloudy": "घने बादल",
    "Overcast": "घना बादल",
    "Rain": "बारिश",
    "Light Rain": "हल्की बारिश",
    "Moderate Rain": "मध्यम बारिश",
    "Heavy Rain": "भारी बारिश",
    "Thunderstorm": "गरज के साथ तूफान",
    "Drizzle": "बूंदाबांदी",
    "Mist": "धुंध",
    "Fog": "कोहरा",
    "Haze": "धुंध",
    "Smoke": "धुआं",
    "Dust": "धूल",
    "Snow": "बर्फबारी"
  };

  const dictMr: Record<string, string> = {
    "Clear": "स्वच्छ हवामान",
    "Sunny": "उन्हाळी",
    "Clouds": "ढगाळ",
    "Partly Cloudy": "अंशतः ढगाळ",
    "Mostly Cloudy": "जास्त ढगाळ",
    "Overcast": "पूर्ण ढगाळ",
    "Rain": "पाऊस",
    "Light Rain": "हलका पाऊस",
    "Moderate Rain": "मध्यम पाऊस",
    "Heavy Rain": "मुसळधार पाऊस",
    "Thunderstorm": "वादळी पाऊस",
    "Drizzle": "रिमझिम",
    "Mist": "धुके",
    "Fog": "दाट धुके",
    "Haze": "धुरकट",
    "Smoke": "धूर",
    "Dust": "धूळ",
    "Snow": "बर्फवृष्टी"
  };

  if (lang === 'hi') return dictHi[condition] || condition;
  if (lang === 'mr') return dictMr[condition] || condition;
  return condition;
};

// Helper function to translate risk categories
export const translateRiskCategory = (cat: string, lang: SupportedLanguage): string => {
  if (!cat) return "";
  const upper = cat.toUpperCase();
  if (lang === 'hi') {
    if (upper === 'LOW') return 'कम जोखिम';
    if (upper === 'MODERATE') return 'मध्यम जोखिम';
    if (upper === 'HIGH') return 'उच्च जोखिम';
    if (upper === 'SEVERE') return 'गंभीर जोखिम';
    return cat;
  }
  if (lang === 'mr') {
    if (upper === 'LOW') return 'कमी धोका';
    if (upper === 'MODERATE') return 'मध्यम धोका';
    if (upper === 'HIGH') return 'उच्च धोका';
    if (upper === 'SEVERE') return 'गंभीर धोका';
    return cat;
  }
  return cat;
};

// Helper function to translate Day names
export const translateDay = (day: string, lang: SupportedLanguage): string => {
  if (!day) return "";
  const daysHi: Record<string, string> = {
    "Today": "आज",
    "Friday": "शुक्रवार",
    "Saturday": "शनिवार",
    "Sunday": "रविवार",
    "Monday": "सोमवार",
    "Tuesday": "मंगलवार",
    "Wednesday": "बुधवार",
    "Thursday": "गुरुवार",
    "Mon": "सोम",
    "Tue": "मंगल",
    "Wed": "बुध",
    "Thu": "गुरु",
    "Fri": "शुक्र",
    "Sat": "शनि",
    "Sun": "रवि"
  };

  const daysMr: Record<string, string> = {
    "Today": "आज",
    "Friday": "शुक्रवार",
    "Saturday": "शनिवार",
    "Sunday": "रविवार",
    "Monday": "सोमवार",
    "Tuesday": "मंगळवार",
    "Wednesday": "बुधवार",
    "Thursday": "गुरूवार",
    "Mon": "सोम",
    "Tue": "मंगळ",
    "Wed": "बुध",
    "Thu": "गुरू",
    "Fri": "शुक्र",
    "Sat": "शनि",
    "Sun": "रवि"
  };

  if (lang === 'hi') return daysHi[day] || day;
  if (lang === 'mr') return daysMr[day] || day;
  return day;
};

// Helper function to translate forecast recommendations
export const translateRecommendation = (rec: string, lang: SupportedLanguage): string => {
  if (!rec) return "";
  if (lang === 'en') return rec;

  const phraseMapHi: Record<string, string> = {
    "Safe outdoor conditions.": "बाहरी गतिविधियों के लिए सुरक्षित स्थिति।",
    "Safe outdoor conditions": "बाहरी गतिविधियों के लिए सुरक्षित स्थिति",
    "Good day for outdoor activities.": "बाहरी गतिविधियों के लिए उत्तम दिन।",
    "Carry umbrella. Possible light showers.": "छाता साथ रखें। हल्की बारिश संभव है।",
    "Moderate rain expected. Plan travel carefully.": "मध्यम बारिश की संभावना। यात्रा का ध्यानपूर्वक नियोजन करें।",
    "Heavy rainfall anticipated. Avoid unnecessary travel.": "भारी बारिश की संभावना। अनावश्यक यात्रा से बचें।",
    "Severe storm warning. Stay indoors.": "गंभीर तूफान की चेतावनी। घर के अंदर रहें।"
  };

  const phraseMapMr: Record<string, string> = {
    "Safe outdoor conditions.": "मैदानी कामांसाठी सुरक्षित परिस्थिती.",
    "Safe outdoor conditions": "मैदानी कामांसाठी सुरक्षित परिस्थिती",
    "Good day for outdoor activities.": "मैदानी उपक्रमांसाठी उत्तम दिवस.",
    "Carry umbrella. Possible light showers.": "छत्री सोबत ठेवा. हलक्या सरींची शक्यता.",
    "Moderate rain expected. Plan travel carefully.": "मध्यम पाऊस अपेक्षित. प्रवासाचे काळजीपूर्वक नियोजन करा.",
    "Heavy rainfall anticipated. Avoid unnecessary travel.": "मुसळधार पाऊस अपेक्षित. अनावश्यक प्रवास टाळा.",
    "Severe storm warning. Stay indoors.": "गंभीर वादळाचा इशारा. घरामध्येच राहा."
  };

  if (lang === 'hi') return phraseMapHi[rec] || rec;
  if (lang === 'mr') return phraseMapMr[rec] || rec;
  return rec;
};

// Helper function to translate risk factors
export const translateRiskFactor = (factor: string, lang: SupportedLanguage): string => {
  if (!factor || lang === 'en') return factor;

  const factorHi: Record<string, string> = {
    "Very High Precipitation Probability (>80%)": "अत्यधिक वर्षा की संभावना (>80%)",
    "High Wind Velocity (>40 km/h)": "तेज हवा की गति (>40 किमी/घंटा)",
    "Extremely Low Visibility (<2 km)": "अत्यंत कम दृश्यता (<2 किमी)",
    "Extreme Heat Wave (>40°C)": "भीषण लू / अत्यधिक तापमान (>40°C)",
    "Poor Air Quality Index (AQI > 200)": "खराब वायु गुणवत्ता (AQI > 200)",
    "High UV Index (>8)": "उच्च यूवी इंडेक्स (>8)"
  };

  const factorMr: Record<string, string> = {
    "Very High Precipitation Probability (>80%)": "अतिवृष्टीची उच्च शक्यता (>80%)",
    "High Wind Velocity (>40 km/h)": "वादळी वार्याचा वेग (>40 किमी/तास)",
    "Extremely Low Visibility (<2 km)": "अत्यंत कमी दृश्यमानता (<2 किमी)",
    "Extreme Heat Wave (>40°C)": "तीव्र उष्णतेची लाट (>40°C)",
    "Poor Air Quality Index (AQI > 200)": "प्रदूषित हवा (AQI > 200)",
    "High UV Index (>8)": "उच्च यूव्ही इंडेक्स (>8)"
  };

  if (lang === 'hi') return factorHi[factor] || factor;
  if (lang === 'mr') return factorMr[factor] || factor;
  return factor;
};
