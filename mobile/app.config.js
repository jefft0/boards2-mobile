export default ({ config }) => {
  if (process.env.MY_ENVIRONMENT === "production") {
    return {
      ...config,
      ios: {
        ...config.ios,
        googleServicesFile: process.env.GOOGLESERVICES_INFO_PLIST,
      },
      android: {
        ...config.android,
        googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
      },
    };
  } else {
    return {
      ...config,
    };
  }
};
