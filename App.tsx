
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { SpecView } from './views/SpecView';
import { AppScreen, User, Language, Transaction } from './types';
import { StorageService } from './services/storageService';
import { EmailService } from './services/emailService';
import { AIService } from './services/geminiService';
import { TEXTS, COLORS } from './constants';
import { 
  Send, 
  ArrowDownCircle, 
  History, 
  Lock, 
  User as UserIcon, 
  HelpCircle, 
  ShieldAlert,
  Wallet,
  CheckCircle2,
  ArrowLeft,
  LogIn,
  UserPlus,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Zap,
  Briefcase,
  QrCode,
  Smartphone,
  ChevronRight,
  BadgePercent
} from 'lucide-react';
import { BigButton } from './components/BigButton';

const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.LANDING);
  const [lang, setLang] = useState<Language>('kn');
  const [user, setUser] = useState<User | null>(null);
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  
  // Forms
  const [formData, setFormData] = useState({ name: '', mobile: '', email: '', pin: '' });
  const [loginData, setLoginData] = useState({ id: '', pin: '' });
  const [sendData, setSendData] = useState({ id: '', amount: '', receiverName: '' });
  const [billData, setBillData] = useState({ type: '', number: '', amount: '' });
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const voiceHasSpoken = useRef<Record<string, boolean>>({});

  const playVoice = useCallback((text: string, l?: Language) => {
    AIService.speak(text, l || lang);
  }, [lang]);

  const navigateTo = (newScreen: AppScreen) => {
    setScreen(newScreen);
    setError(null);
    window.scrollTo(0, 0); // Reset scroll on navigation
    if (newScreen === AppScreen.SEND_MONEY) {
      setSendData({ id: '', amount: '', receiverName: '' });
    }
    if (newScreen === AppScreen.BILL_PAY) {
      setBillData({ type: '', number: '', amount: '' });
    }
    if (newScreen === AppScreen.SIGNUP) {
      setFormData({ name: '', mobile: '', email: '', pin: '' });
      setEmailVerified(false);
      setOtpSent(false);
      setOtpValue('');
    }
  };

  useEffect(() => {
    const key = `${screen}-${lang}`;
    if (voiceHasSpoken.current[key]) return;

    const currentTexts = TEXTS[lang];
    switch(screen) {
      case AppScreen.LANDING:
        playVoice(currentTexts.welcome + ". " + currentTexts.chooseLanguage);
        break;
      case AppScreen.LOGIN:
        playVoice(currentTexts.loginTitle + ". " + currentTexts.accIdLabel);
        break;
      case AppScreen.SIGNUP:
        playVoice(currentTexts.signup);
        break;
      case AppScreen.DASHBOARD:
        if (user) playVoice(currentTexts.welcome + ", " + user.name + ". " + currentTexts.balance + " is " + user.balance);
        break;
      case AppScreen.SIGNUP_SUCCESS:
        if (generatedId) playVoice(currentTexts.signupSuccess + ". " + currentTexts.saveIdMsg + ". Your ID is " + generatedId.split('').join(' '));
        break;
    }
    voiceHasSpoken.current[key] = true;
  }, [screen, lang, user, generatedId, playVoice]);

  const handleEmailVerification = async () => {
    if (!formData.email) {
      const msg = lang === 'kn' ? 'ದಯವಿಟ್ಟು ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ' : 'Please enter email address';
      setError(msg);
      playVoice(msg);
      return;
    }

    setIsVerifyingEmail(true);
    setError(null);

    try {
      const result = await EmailService.verifyEmail(formData.email);
      if (result.isValid) {
        const otp = EmailService.sendVerificationOTP(formData.email);
        setOtpSent(true);
        const msg = lang === 'kn' ? 'ಪರಿಶೀಲನಾ ಕೋಡ್ ಕಳುಹಿಸಲಾಗಿದೆ' : `Verification code sent to ${formData.email}`;
        playVoice(msg);
      } else {
        setError(result.message);
        playVoice(result.message);
      }
    } catch (err) {
      const msg = lang === 'kn' ? 'ಇಮೇಲ್ ಪರಿಶೀಲನೆ ವಿಫಲವಾಗಿದೆ' : 'Email verification failed';
      setError(msg);
      playVoice(msg);
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const handleOTPVerification = () => {
    if (!otpValue || otpValue.length !== 6) {
      const msg = lang === 'kn' ? 'ದಯವಿಟ್ಟು 6 ಅಂಕಿಯ ಕೋಡ್ ನಮೂದಿಸಿ' : 'Please enter 6-digit code';
      setError(msg);
      playVoice(msg);
      return;
    }

    if (EmailService.verifyOTP(formData.email, otpValue)) {
      setEmailVerified(true);
      EmailService.registerEmail(formData.email);
      const msg = lang === 'kn' ? 'ಇಮೇಲ್ ಯಶಸ್ವಿಯಾಗಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ' : 'Email verified successfully';
      playVoice(msg);
      setError(null);
    } else {
      const msg = lang === 'kn' ? 'ಅಮಾನ್ಯ ಪರಿಶೀಲನಾ ಕೋಡ್' : 'Invalid verification code';
      setError(msg);
      playVoice(msg);
    }
  };

  const handleSignup = () => {
    if (!formData.name || !formData.mobile || !formData.email || formData.pin.length !== 4) {
      const msg = lang === 'kn' ? 'ದಯವಿಟ್ಟು ಎಲ್ಲಾ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ' : 'Please fill all details correctly';
      setError(msg);
      playVoice(msg);
      return;
    }

    if (!emailVerified) {
      const msg = lang === 'kn' ? 'ದಯವಿಟ್ಟು ಮೊದಲು ನಿಮ್ಮ ಇಮೇಲ್ ಪರಿಶೀಲಿಸಿ' : 'Please verify your email first';
      setError(msg);
      playVoice(msg);
      return;
    }

    const newId = StorageService.generateId();
    const newUser: User = {
      id: newId,
      name: formData.name,
      mobile: formData.mobile,
      email: formData.email,
      pin: formData.pin,
      language: lang,
      balance: 10000 
    };

    StorageService.saveUser(newUser);
    setGeneratedId(newId);
    navigateTo(AppScreen.SIGNUP_SUCCESS);
  };

  const handleLogin = () => {
    const storedUser = StorageService.getUser();
    if (storedUser && storedUser.id === loginData.id.toUpperCase() && storedUser.pin === loginData.pin) {
      setUser(storedUser);
      setLang(storedUser.language);
      navigateTo(AppScreen.DASHBOARD);
    } else {
      const msg = storedUser && storedUser.id === loginData.id.toUpperCase() ? TEXTS[lang].wrongPin : TEXTS[lang].invalidFormat;
      setError(msg);
      playVoice(msg);
    }
  };

  const handleIdInput = (val: string) => {
    setSendData(prev => ({ ...prev, id: val.toUpperCase(), receiverName: '' }));
    if (val.length >= 10) {
      setIsVerifying(true);
      setTimeout(() => {
        const name = StorageService.mockSearchName(val);
        setSendData(prev => ({ ...prev, receiverName: name || '' }));
        setIsVerifying(false);
        if (name) {
          playVoice(`${TEXTS[lang].idFound} ${name}. ${TEXTS[lang].confirm}`);
        } else {
          setError(TEXTS[lang].invalidFormat);
          playVoice(TEXTS[lang].invalidFormat);
        }
      }, 600);
    }
  };

  const handleTransfer = () => {
    if (!sendData.receiverName || !sendData.amount) {
      playVoice(TEXTS[lang].invalidFormat);
      return;
    }

    const amount = parseFloat(sendData.amount);
    if (user && user.balance >= amount) {
      const newBalance = user.balance - amount;
      const updatedUser = { ...user, balance: newBalance };
      
      const tx: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'debit', amount, date: new Date().toLocaleDateString(),
        description: `Sent to ${sendData.receiverName}`,
        category: 'Transfer'
      };

      StorageService.saveUser(updatedUser);
      StorageService.saveTransaction(tx);
      setUser(updatedUser);
      navigateTo(AppScreen.SUCCESS);
      playVoice(`${TEXTS[lang].success}. Sent ${amount} to ${sendData.receiverName}`);
    } else {
      playVoice("Not enough balance");
    }
  };

  const handleBillPayment = () => {
    if (!billData.amount || !billData.number) {
        playVoice("Please enter details");
        return;
    }
    const amount = parseFloat(billData.amount);
    if (user && user.balance >= amount) {
        const newBalance = user.balance - amount;
        const updatedUser = { ...user, balance: newBalance };
        const tx: Transaction = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'debit', amount, date: new Date().toLocaleDateString(),
            description: `${billData.type} Payment: ${billData.number}`,
            category: 'Bill'
        };
        StorageService.saveUser(updatedUser);
        StorageService.saveTransaction(tx);
        setUser(updatedUser);
        navigateTo(AppScreen.SUCCESS);
        playVoice("Bill paid successfully");
    } else {
        playVoice("Not enough money in bank");
    }
  };

  // --- RENDERS ---

  const renderLoans = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="flex items-center gap-4">
        <button onClick={() => navigateTo(AppScreen.DASHBOARD)} className="p-4 bg-white rounded-2xl shadow-sm"><ArrowLeft /></button>
        <h2 className="text-3xl font-black">{TEXTS[lang].loans}</h2>
      </div>

      <div className="grid gap-4">
        {[
          { title: 'Kisan Credit Card', interest: '4%', max: '₹3,00,000', icon: <Briefcase /> },
          { title: 'Gold Loan', interest: '7.5%', max: '₹10,00,000', icon: <TrendingUp /> },
          { title: 'Small Business', interest: '9%', max: '₹1,00,000', icon: <Smartphone /> }
        ].map((loan, i) => (
          <div key={i} className="p-6 bg-white rounded-3xl border-4 border-slate-50 shadow-sm flex items-center justify-between group cursor-pointer active:scale-95 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                 {loan.icon}
              </div>
              <div>
                <h3 className="font-black text-slate-900">{loan.title}</h3>
                <p className="text-xs font-bold text-slate-400">Interest: {loan.interest} • Up to {loan.max}</p>
              </div>
            </div>
            <ChevronRight className="text-slate-200 group-hover:text-emerald-500" />
          </div>
        ))}
      </div>
    </div>
  );

  const renderBillPay = () => (
    <div className="space-y-6 animate-in slide-in-from-right duration-300">
      <div className="flex items-center gap-4">
        <button onClick={() => navigateTo(AppScreen.DASHBOARD)} className="p-4 bg-white rounded-2xl shadow-sm"><ArrowLeft /></button>
        <h2 className="text-3xl font-black">{TEXTS[lang].billPay}</h2>
      </div>

      {!billData.type ? (
        <div className="grid grid-cols-2 gap-4">
           {['Mobile', 'Electricity', 'Water', 'DTH'].map(type => (
             <button 
              key={type} 
              onClick={() => {
                setBillData({...billData, type});
                playVoice(`Paying for ${type}. Enter details.`);
              }}
              className="p-8 bg-white rounded-3xl border-4 border-slate-50 flex flex-col items-center gap-3 font-black text-slate-800 shadow-sm active:scale-95 transition-all"
             >
               <Zap className="text-amber-500 w-10 h-10" />
               {type}
             </button>
           ))}
        </div>
      ) : (
        <div className="bg-white p-8 rounded-[2.5rem] border-4 border-emerald-50 shadow-xl space-y-6">
           <div className="text-center">
              <h3 className="text-2xl font-black text-slate-900">{billData.type} Payment</h3>
              <button onClick={() => setBillData({...billData, type: ''})} className="text-xs text-emerald-600 font-bold uppercase underline mt-1">Change Category</button>
           </div>
           <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Number / ID</label>
                <input 
                  type="text" 
                  placeholder="Consumer Number" 
                  className="w-full p-6 rounded-2xl border-4 border-slate-50 outline-none text-xl font-bold text-center focus:border-emerald-500"
                  value={billData.number}
                  onChange={e => setBillData({...billData, number: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Amount (₹)</label>
                <input 
                  type="number" 
                  placeholder="₹ 0.00" 
                  className="w-full p-6 rounded-2xl border-4 border-slate-50 outline-none text-3xl font-black text-center focus:border-emerald-500"
                  value={billData.amount}
                  onChange={e => setBillData({...billData, amount: e.target.value})}
                />
              </div>
              <button 
                onClick={handleBillPayment}
                className="w-full p-8 bg-emerald-600 text-white rounded-3xl font-black text-2xl shadow-lg active:scale-95"
              >
                Pay Bill
              </button>
           </div>
        </div>
      )}
    </div>
  );

  const renderAnalysis = () => (
    <div className="space-y-8 animate-in slide-in-from-right duration-300">
      <div className="flex items-center gap-4">
        <button onClick={() => navigateTo(AppScreen.DASHBOARD)} className="p-3 bg-white rounded-2xl shadow-sm"><ArrowLeft /></button>
        <h2 className="text-2xl font-black">{TEXTS[lang].reportTitle}</h2>
      </div>

      <div className="bg-white p-6 rounded-[2rem] shadow-xl border-4 border-emerald-50 space-y-8">
        <div className="flex justify-between items-end h-56 gap-4 px-2">
           {[
            { label: 'Seeds', val: '75%', color: 'bg-emerald-500', amount: '₹1200' },
            { label: 'Milk', val: '95%', color: 'bg-blue-400', amount: '₹5500' },
            { label: 'Food', val: '40%', color: 'bg-amber-400', amount: '₹450' },
            { label: 'Rent', val: '30%', color: 'bg-slate-300', amount: '₹300' },
            { label: 'Phone', val: '20%', color: 'bg-pink-400', amount: '₹150' }
           ].map((cat, i) => (
             <div key={i} className="flex-1 flex flex-col items-center gap-3">
                <span className="text-[10px] font-black text-slate-800">{cat.amount}</span>
                <div className={`w-full ${cat.color} rounded-t-2xl transition-all duration-1000 shadow-lg`} style={{ height: cat.val }} />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter text-center">{cat.label}</span>
             </div>
           ))}
        </div>
      </div>

      <div className="p-8 bg-emerald-600 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl" />
         <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
               <TrendingUp className="w-8 h-8" />
            </div>
            <div>
               <h4 className="text-2xl font-black">Good Job!</h4>
               <p className="opacity-90 font-medium">You saved ₹1,200 more than last month. Keep it up!</p>
            </div>
         </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-8 animate-in slide-in-from-bottom duration-500 pb-20">
      <div className={`p-8 rounded-[2.5rem] text-white shadow-2xl ${COLORS.primary} relative overflow-hidden border-b-[12px] border-emerald-700`}>
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center"><Wallet className="w-7 h-7" /></div>
             <p className="text-emerald-100 font-black uppercase tracking-widest text-sm">{TEXTS[lang].balance}</p>
          </div>
          <h2 className="text-6xl font-black tracking-tighter drop-shadow-lg">₹ {user?.balance.toLocaleString()}</h2>
        </div>
      </div>

      <div className="bg-gradient-to-r from-orange-400 to-amber-500 p-5 rounded-3xl shadow-lg flex items-center justify-between text-white border-2 border-white">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
               <BadgePercent className="w-8 h-8" />
            </div>
            <div>
               <h4 className="font-black text-sm uppercase">Limited Offer</h4>
               <p className="text-xs font-bold opacity-90">Micro-loans for seeds at 1% interest.</p>
            </div>
         </div>
         <button onClick={() => navigateTo(AppScreen.LOANS)} className="bg-white text-amber-600 px-4 py-2 rounded-xl text-xs font-black">APPLY</button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <BigButton 
          icon={<Send className="text-emerald-600 w-11 h-11" />} 
          label={TEXTS[lang].sendMoney} 
          onClick={() => navigateTo(AppScreen.SEND_MONEY)} 
          color="bg-white border-b-8 border-emerald-100"
        />
        <BigButton 
          icon={<QrCode className="text-blue-600 w-11 h-11" />} 
          label={TEXTS[lang].receiveMoney} 
          onClick={() => navigateTo(AppScreen.RECEIVE_MONEY)} 
          color="bg-white border-b-8 border-blue-100"
        />
        <BigButton 
          icon={<Zap className="text-amber-500 w-11 h-11" />} 
          label={TEXTS[lang].billPay} 
          onClick={() => navigateTo(AppScreen.BILL_PAY)} 
          color="bg-white border-b-8 border-amber-50"
        />
        <BigButton 
          icon={<Briefcase className="text-indigo-600 w-11 h-11" />} 
          label={TEXTS[lang].loans} 
          onClick={() => navigateTo(AppScreen.LOANS)} 
          color="bg-white border-b-8 border-indigo-50"
        />
        <BigButton 
          icon={<BarChart3 className="text-pink-600 w-11 h-11" />} 
          label="Reports" 
          onClick={() => navigateTo(AppScreen.ANALYSIS)} 
          color="bg-white border-b-8 border-pink-50"
        />
        <BigButton 
          icon={<History className="text-slate-600 w-11 h-11" />} 
          label={TEXTS[lang].lastFive} 
          onClick={() => navigateTo(AppScreen.TRANSACTIONS)} 
          color="bg-white border-b-8 border-slate-100"
        />
      </div>

      <div className="grid gap-4">
        <button 
          onClick={() => navigateTo(AppScreen.PROFILE)}
          className="w-full p-8 bg-slate-900 rounded-[2rem] text-white font-black flex items-center justify-between gap-3 shadow-xl transition-transform active:scale-95"
        >
          <div className="flex items-center gap-4">
             <UserIcon className="w-7 h-7 text-emerald-400" />
             <span className="text-xl uppercase tracking-wider">{TEXTS[lang].profile}</span>
          </div>
          <ArrowLeft className="rotate-180 opacity-40" />
        </button>

        <button 
          onClick={() => navigateTo(AppScreen.PROJECT_SPECS)}
          className="w-full p-4 bg-emerald-50 text-emerald-800 rounded-2xl font-black text-xs uppercase tracking-widest border border-emerald-100"
        >
          View Case Study Info
        </button>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen bg-gradient-to-b ${COLORS.bgGradient} flex flex-col`}>
      <Header lang={lang} onLanguageChange={setLang} />
      
      <main className="flex-1 max-w-md mx-auto px-6 py-8 pb-32 w-full h-full overflow-y-visible">
        {screen === AppScreen.LANDING && (
          <div className="space-y-12 py-10 animate-in fade-in duration-700 text-center">
            <div className="w-28 h-28 bg-emerald-600 rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl border-4 border-white">
              <ShieldAlert className="text-white w-14 h-14" />
            </div>
            <div className="space-y-2">
               <h2 className="text-4xl font-black text-slate-900 leading-tight">{TEXTS[lang].welcome}</h2>
               <p className="text-slate-400 font-bold uppercase tracking-widest">{TEXTS[lang].tagline}</p>
            </div>
            <div className="grid gap-6">
              <button onClick={() => navigateTo(AppScreen.LOGIN)} className="w-full p-8 bg-white rounded-[2.5rem] shadow-xl border-4 border-emerald-500 flex items-center gap-8 group active:scale-95 transition-all text-left">
                <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600"><LogIn className="w-10 h-10" /></div>
                <span className="text-2xl font-black text-slate-800 leading-none">{TEXTS[lang].landingLogin}</span>
              </button>
              <button onClick={() => navigateTo(AppScreen.SIGNUP)} className="w-full p-8 bg-emerald-600 rounded-[2.5rem] shadow-xl border-4 border-emerald-700 flex items-center gap-8 group active:scale-95 transition-all text-left">
                <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center text-white"><UserPlus className="w-10 h-10" /></div>
                <span className="text-2xl font-black text-white leading-none">{TEXTS[lang].landingSignup}</span>
              </button>
            </div>
          </div>
        )}

        {screen === AppScreen.LOGIN && (
          <div className="space-y-8 animate-in slide-in-from-right duration-300">
             <div className="flex items-center gap-4"><button onClick={() => navigateTo(AppScreen.LANDING)} className="p-4 rounded-2xl bg-white shadow-md"><ArrowLeft /></button><h2 className="text-2xl font-black">{TEXTS[lang].loginTitle}</h2></div>
             <div className="space-y-8">
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">My Bank ID</label>
                   <input type="text" placeholder="BANK-KA-..." className="w-full p-7 rounded-3xl border-4 border-slate-100 outline-none text-2xl font-mono uppercase shadow-inner focus:border-emerald-500" value={loginData.id} onChange={e => setLoginData(p => ({...p, id: e.target.value}))}/>
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">My 4-Digit PIN</label>
                   <input type="password" maxLength={4} placeholder="PIN" className="w-full p-7 rounded-3xl border-4 border-slate-100 outline-none text-5xl text-center tracking-[1em] shadow-inner focus:border-emerald-500" value={loginData.pin} onChange={e => setLoginData(p => ({...p, pin: e.target.value}))}/>
                </div>
                {error && <div className="p-7 bg-red-50 text-red-700 font-bold rounded-3xl border-2 border-red-100 flex items-center gap-4"><AlertCircle className="w-8 h-8 flex-shrink-0" /> {error}</div>}
                <button onClick={handleLogin} className="w-full p-9 bg-emerald-600 text-white rounded-[2.5rem] font-black text-3xl shadow-2xl active:scale-95 transition-transform">{TEXTS[lang].loginBtn}</button>
             </div>
          </div>
        )}

        {screen === AppScreen.SIGNUP && (
          <div className="space-y-8 animate-in slide-in-from-right duration-300">
             <div className="flex items-center gap-4"><button onClick={() => navigateTo(AppScreen.LANDING)} className="p-4 rounded-2xl bg-white shadow-md"><ArrowLeft /></button><h2 className="text-2xl font-black">{TEXTS[lang].signup}</h2></div>
             <div className="space-y-6">
                <input type="text" placeholder={TEXTS[lang].name} className="w-full p-7 rounded-3xl border-4 border-slate-100 outline-none text-2xl font-bold shadow-inner" value={formData.name} onChange={e => setFormData(p => ({...p, name: e.target.value}))}/>
                <input type="tel" placeholder={TEXTS[lang].mobile} className="w-full p-7 rounded-3xl border-4 border-slate-100 outline-none text-2xl font-bold shadow-inner" value={formData.mobile} onChange={e => setFormData(p => ({...p, mobile: e.target.value}))}/>
                
                <div className="space-y-2">
                   <input 
                     type="email" 
                     placeholder="Email Address" 
                     className="w-full p-7 rounded-3xl border-4 border-slate-100 outline-none text-2xl font-bold shadow-inner" 
                     value={formData.email} 
                     onChange={e => setFormData(p => ({...p, email: e.target.value}))}
                     disabled={emailVerified}
                   />
                   {emailVerified && (
                     <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        Email verified successfully
                     </div>
                   )}
                </div>

                {!emailVerified && (
                  <div className="space-y-3">
                    {!otpSent ? (
                      <button 
                        onClick={handleEmailVerification} 
                        disabled={isVerifyingEmail || !formData.email}
                        className="w-full p-6 bg-blue-600 text-white rounded-3xl font-black text-xl shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {isVerifyingEmail ? 'Verifying...' : 'Verify Email'}
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <div className="space-y-2">
                           <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-2">Enter 6-digit Code</label>
                           <input 
                             type="text" 
                             maxLength={6} 
                             placeholder="000000" 
                             className="w-full p-7 rounded-3xl border-4 border-slate-100 outline-none text-3xl font-mono text-center tracking-[0.5em] shadow-inner focus:border-blue-500" 
                             value={otpValue} 
                             onChange={e => setOtpValue(e.target.value.replace(/\D/g, ''))}
                           />
                        </div>
                        <button 
                          onClick={handleOTPVerification} 
                          className="w-full p-6 bg-emerald-600 text-white rounded-3xl font-black text-xl shadow-lg active:scale-95"
                        >
                          Verify Code
                        </button>
                        <button 
                          onClick={() => {
                            setOtpSent(false);
                            setOtpValue('');
                            setError(null);
                          }}
                          className="w-full p-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <input type="password" maxLength={4} placeholder={TEXTS[lang].pin} className="w-full p-7 rounded-3xl border-4 border-slate-100 outline-none text-5xl text-center tracking-[1em] shadow-inner" value={formData.pin} onChange={e => setFormData(p => ({...p, pin: e.target.value}))}/>
                <button 
                  onClick={handleSignup} 
                  disabled={!emailVerified}
                  className="w-full p-9 bg-emerald-600 text-white rounded-[2.5rem] font-black text-3xl shadow-2xl active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {TEXTS[lang].registerBtn}
                </button>
             </div>
          </div>
        )}

        {screen === AppScreen.SIGNUP_SUCCESS && (
          <div className="text-center space-y-10 animate-in zoom-in-95">
            <div className="w-32 h-32 bg-emerald-100 rounded-full mx-auto flex items-center justify-center text-emerald-600 border-8 border-white shadow-xl"><CheckCircle2 className="w-20 h-20" /></div>
            <div className="space-y-3">
               <h2 className="text-4xl font-black text-emerald-900">{TEXTS[lang].signupSuccess}</h2>
               <p className="text-slate-500 font-bold px-4">{TEXTS[lang].saveIdMsg}</p>
            </div>
            <div className="p-10 bg-white rounded-[3rem] border-4 border-emerald-500 shadow-2xl font-mono text-4xl font-black text-emerald-800 break-all select-all">
               {generatedId}
            </div>
            <button onClick={() => navigateTo(AppScreen.LOGIN)} className="w-full p-9 bg-slate-900 text-white rounded-[2.5rem] font-black text-3xl shadow-2xl">Go to Login</button>
          </div>
        )}

        {screen === AppScreen.DASHBOARD && renderDashboard()}
        {screen === AppScreen.BILL_PAY && renderBillPay()}
        {screen === AppScreen.LOANS && renderLoans()}

        {screen === AppScreen.SEND_MONEY && (
          <div className="space-y-8 animate-in slide-in-from-right">
             <div className="flex items-center gap-4"><button onClick={() => navigateTo(AppScreen.DASHBOARD)} className="p-4 bg-white rounded-2xl shadow-sm"><ArrowLeft /></button><h2 className="text-3xl font-black">{TEXTS[lang].sendMoney}</h2></div>
             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-xs font-black text-slate-400 uppercase pl-2">Receiver Account ID</label>
                   <input type="text" placeholder="BANK-KA-..." value={sendData.id} onChange={e => handleIdInput(e.target.value)} className="w-full p-7 rounded-[2rem] border-4 border-slate-100 outline-none text-2xl font-mono shadow-inner focus:border-emerald-500"/>
                </div>
                {isVerifying && <p className="animate-pulse text-center font-black text-xl text-amber-600">Verifying Name...</p>}
                {sendData.receiverName && (
                  <div className="bg-emerald-50 p-8 rounded-[3rem] border-4 border-emerald-200 text-center space-y-6 shadow-lg animate-in zoom-in-95">
                    <p className="text-sm font-black text-emerald-600 uppercase tracking-widest">SENDING MONEY TO</p>
                    <h3 className="text-5xl font-black text-emerald-900">{sendData.receiverName}</h3>
                    <div className="relative">
                       <span className="absolute left-6 top-1/2 -translate-y-1/2 text-4xl font-black text-slate-400">₹</span>
                       <input type="number" placeholder="Amount" value={sendData.amount} onChange={e => setSendData(p => ({...p, amount: e.target.value}))} className="w-full p-8 pl-14 rounded-3xl border-4 border-emerald-100 text-5xl font-black text-center outline-none focus:border-emerald-500"/>
                    </div>
                    <button onClick={handleTransfer} className="w-full p-9 bg-emerald-600 text-white rounded-[2.5rem] font-black text-3xl shadow-xl shadow-emerald-200">PAY NOW</button>
                  </div>
                )}
             </div>
          </div>
        )}

        {screen === AppScreen.ANALYSIS && renderAnalysis()}

        {screen === AppScreen.SUCCESS && (
          <div className="text-center py-20 space-y-10 animate-in zoom-in-95">
             <div className="w-36 h-36 bg-emerald-100 rounded-full mx-auto flex items-center justify-center text-emerald-600 border-8 border-white shadow-2xl animate-bounce"><CheckCircle2 className="w-24 h-24" /></div>
             <h2 className="text-5xl font-black text-emerald-900">{TEXTS[lang].success}</h2>
             <button onClick={() => { navigateTo(AppScreen.DASHBOARD); }} className="w-full p-9 bg-slate-900 text-white rounded-[2.5rem] font-black text-3xl shadow-2xl">{TEXTS[lang].done}</button>
          </div>
        )}

        {screen === AppScreen.TRANSACTIONS && (
          <div className="space-y-8">
            <div className="flex items-center gap-4"><button onClick={() => navigateTo(AppScreen.DASHBOARD)} className="p-4 bg-white rounded-2xl shadow-sm"><ArrowLeft /></button><h2 className="text-3xl font-black">{TEXTS[lang].lastFive}</h2></div>
            <div className="space-y-4">
              {StorageService.getTransactions().map((tx, i) => (
                <div key={i} className="p-6 bg-white rounded-[2rem] border-b-4 border-slate-100 shadow-sm flex justify-between items-center animate-in slide-in-from-bottom duration-300">
                  <div className="flex items-center gap-4">
                     <div className={`p-4 rounded-2xl ${tx.type === 'credit' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                        {tx.type === 'credit' ? <ArrowDownCircle /> : <Send />}
                     </div>
                     <div>
                       <p className="font-black text-slate-800 text-lg leading-tight">{tx.description}</p>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{tx.date} • {tx.category}</p>
                     </div>
                  </div>
                  <p className={`text-2xl font-black ${tx.type === 'credit' ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {tx.type === 'credit' ? '+' : '-'} ₹{tx.amount}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {screen === AppScreen.RECEIVE_MONEY && (
          <div className="space-y-8 animate-in slide-in-from-right">
             <div className="flex items-center gap-4"><button onClick={() => navigateTo(AppScreen.DASHBOARD)} className="p-4 bg-white rounded-2xl shadow-sm"><ArrowLeft /></button><h2 className="text-3xl font-black">{TEXTS[lang].receiveMoney}</h2></div>
             <div className="p-10 bg-white rounded-[3.5rem] border-[12px] border-emerald-50 text-center space-y-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
                <div className="bg-slate-50 aspect-square rounded-[2rem] flex items-center justify-center border-4 border-dashed border-emerald-200 relative group">
                   <div className="w-5/6 h-5/6 bg-white rounded-xl shadow-inner flex flex-wrap p-4 opacity-80">
                      {Array.from({length: 36}).map((_, i) => (
                        <div key={i} className={`w-1/6 h-1/6 border border-slate-100 ${Math.random() > 0.5 ? 'bg-emerald-900' : 'bg-white'}`} />
                      ))}
                   </div>
                   <QrCode className="absolute w-20 h-20 text-emerald-900/10" />
                </div>
                <div className="space-y-3">
                   <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Share this ID to get money</p>
                   <div className="bg-emerald-50 py-6 px-4 rounded-3xl border-2 border-emerald-100">
                      <p className="text-3xl font-black text-emerald-800 font-mono tracking-tighter select-all">{user?.id}</p>
                   </div>
                </div>
             </div>
          </div>
        )}

        {screen === AppScreen.PROFILE && (
          <div className="space-y-8 animate-in slide-in-from-right">
             <div className="flex items-center gap-4"><button onClick={() => navigateTo(AppScreen.DASHBOARD)} className="p-4 bg-white rounded-2xl shadow-sm"><ArrowLeft /></button><h2 className="text-3xl font-black">My Profile</h2></div>
             <div className="bg-white p-10 rounded-[2.5rem] border-4 border-slate-50 space-y-8 shadow-xl">
                <div className="flex items-center gap-6 pb-6 border-b-2 border-slate-50">
                   <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-lg">
                      {user?.name[0]}
                   </div>
                   <div>
                      <h3 className="text-3xl font-black text-slate-900">{user?.name}</h3>
                      <p className="font-bold text-slate-400">{user?.mobile}</p>
                   </div>
                </div>
                <div className="space-y-4">
                   <div className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest">ID</span>
                      <span className="text-xl font-black text-slate-800 font-mono">{user?.id}</span>
                   </div>
                </div>
                <button onClick={() => { StorageService.clear(); setUser(null); navigateTo(AppScreen.LANDING); }} className="w-full p-8 bg-red-50 text-red-600 rounded-[2rem] font-black text-2xl border-2 border-red-100 transition-transform active:scale-95 shadow-sm">Sign Out Safely</button>
             </div>
          </div>
        )}

        {screen === AppScreen.PROJECT_SPECS && <SpecView onStart={() => navigateTo(AppScreen.LANDING)} />}
      </main>

      <footer className="bg-white border-t border-slate-200 py-10 px-4 text-center">
         <div className="max-w-md mx-auto">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-3">Project Documentation</p>
            <p className="text-slate-900 font-black text-sm leading-relaxed px-4">
              Created by <span className="text-emerald-600">Basavarajsing</span> <br/>
              Part of <span className="text-indigo-600">DT&UE Laboratory</span> Case Study 1
            </p>
            <div className="flex justify-center gap-6 mt-6">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
               <div className="w-2 h-2 rounded-full bg-emerald-300"></div>
               <div className="w-2 h-2 rounded-full bg-emerald-100"></div>
            </div>
            <p className="text-slate-300 text-[8px] mt-8 font-bold uppercase tracking-widest italic">Simulation Environment Only</p>
         </div>
      </footer>
    </div>
  );
};

export default App;
