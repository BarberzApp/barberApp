interface Window {
  gapi: {
    load: (api: string, options: { callback: () => void; onerror: (error: any) => void }) => void;
    client: {
      init: (config: {
        apiKey: string;
        clientId: string;
        discoveryDocs: string[];
        scope: string;
      }) => Promise<void>;
      calendar: {
        events: {
          insert: (params: {
            calendarId: string;
            resource: any;
          }) => Promise<{ result: any }>;
        };
      };
    };
    auth2: {
      getAuthInstance: () => {
        isSignedIn: {
          get: () => boolean;
        };
        signIn: () => Promise<any>;
      };
    };
  };
} 