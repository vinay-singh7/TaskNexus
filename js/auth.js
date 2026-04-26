/* ============================================================
   TASKNEXUS — AUTH UTILITY (Clerk Wrapper)
   ============================================================ */

const Auth = (() => {
  // We will store the Clerk instance here once initialized
  let clerkInstance = null;

  return {
    async initClerk(publishableKey) {
      if (window.Clerk) {
        clerkInstance = window.Clerk;
        try {
          await clerkInstance.load({ publishableKey });
          return clerkInstance;
        } catch (err) {
          console.error("Failed to load Clerk:", err);
          return null;
        }
      } else {
        console.error("Clerk script not loaded.");
        return null;
      }
    },

    isLoggedIn() { 
      return clerkInstance && clerkInstance.user !== null; 
    },
    
    getSession() {
      if (!clerkInstance || !clerkInstance.user) return null;
      const u = clerkInstance.user;
      return {
        userId: u.id,
        email: u.primaryEmailAddress ? u.primaryEmailAddress.emailAddress : '',
        name: u.fullName || u.firstName || 'User',
      };
    },

    logout() {
      if (clerkInstance) {
        clerkInstance.signOut().then(() => {
          const base = window.location.href.split('#')[0].replace(/\/[^/]*$/, '/');
          window.location.replace(base + 'index.html');
        });
      }
    },

    requireAuth() {
      if (!this.isLoggedIn()) {
        const base = window.location.href.split('#')[0].replace(/\/[^/]*$/, '/');
        window.location.replace(base + 'login.html');
        return false;
      }
      return true;
    },

    getClerk() {
      return clerkInstance;
    }
  };
})();

window.Auth = Auth;
