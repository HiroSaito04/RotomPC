// filepath: rotompc-client/src/context/AppBootContext.jsx

import { createContext, useContext } from "react";

/* =========================================================
   CONTEXT
========================================================= */

const AppBootContext = createContext({
  appReady: false,
  splashVisible: true,
});

/* =========================================================
   PROVIDER
========================================================= */

export const AppBootProvider = ({
  appReady = false,
  splashVisible = true,
  children,
}) => {
  return (
    <AppBootContext.Provider
      value={{
        appReady,
        splashVisible,
      }}
    >
      {children}
    </AppBootContext.Provider>
  );
};

/* =========================================================
   HOOK
========================================================= */

export const useAppBoot = () => useContext(AppBootContext);

export default AppBootContext;
