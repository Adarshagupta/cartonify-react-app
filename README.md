# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

# Cartonify - AI Image Generator

A React Native application that generates cartoon-style images using AI via the Replicate API.

## Remote Design Updates

This app is configured with Expo EAS Update, allowing you to push design changes and minor updates without requiring app store resubmission.

### Initial Setup

1. **Build and submit your app**
   ```
   npx eas-cli build --platform android --profile production
   npx eas-cli submit --platform android
   ```
   
   For iOS:
   ```
   npx eas-cli build --platform ios --profile production
   npx eas-cli submit --platform ios
   ```

2. **Make sure your API key is set**
   Set your Replicate API key in the app settings or in the .env file.

### Publishing Updates

When you make design changes, you can publish them remotely using:

```bash
# Development updates
npm run publish-update development "Design update description"

# Production updates
npm run publish-update production "Design update description"
```

Users will receive updates automatically when they open the app.

### Update Workflow

1. Make your design changes in the codebase
2. Test them locally with `npm start`
3. Commit your changes
4. Run `npm run publish-update` to push the updates to all users
5. No app store resubmission required!

### Limitations

- Major functionality changes still require app store resubmission
- Native code changes (new native modules) can't be updated remotely
- Updates are downloaded when users open the app (not in the background)

### Troubleshooting

If updates aren't appearing:
- Check that the app has internet connectivity
- Verify you published to the correct branch (development/production)
- Make sure your app.json has the correct projectId
