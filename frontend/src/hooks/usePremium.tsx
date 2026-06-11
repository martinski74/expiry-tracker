import React, { createContext, useContext, useState, useEffect } from 'react';
import Purchases, { CustomerInfo } from 'react-native-purchases';

interface PremiumContextType {
  isPremium: boolean;
  isLoading: boolean;
  checkPremiumStatus: () => Promise<boolean>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const updatePremiumStatus = (customerInfo: CustomerInfo) => {
    // "premium" е идентификаторът (Entitlement), който създадохме в сайта на RevenueCat
    if (customerInfo.entitlements.active['premium'] !== undefined) {
      setIsPremium(true);
    } else {
      setIsPremium(false);
    }
    setIsLoading(false);
  };

  const checkPremiumStatus = async (): Promise<boolean> => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const hasPremium = customerInfo.entitlements.active['premium'] !== undefined;
      setIsPremium(hasPremium);
      return hasPremium;
    } catch (e) {
      console.error("Грешка при проверка на Premium статус:", e);
      return false;
    }
  };

  useEffect(() => {
    // Вземане на текущия статус при стартиране
    checkPremiumStatus();

    // Слушател: Ако потребителят купи абонамент, статусът се обновява веднага автоматично
    const listener = (customerInfo: CustomerInfo) => {
      updatePremiumStatus(customerInfo);
    };

    Purchases.addCustomerInfoUpdateListener(listener);

    return () => {
      // Почистване на слушателя при затваряне
      // За по-нови версии на SDK: Purchases.removeCustomerInfoUpdateListener(listener); 
    };
  }, []);

  return (
    <PremiumContext.Provider value={{ isPremium, isLoading, checkPremiumStatus }}>
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium трябва да се използва вътре в PremiumProvider');
  }
  return context;
};