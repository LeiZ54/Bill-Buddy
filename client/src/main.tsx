import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/router';
import '../preflight.css'
import './index.css'
import { GoogleOAuthProvider } from "@react-oauth/google";

const CLIENT_ID = "738637372892-v08vqlumjleioiq7bfc5lde3u5jpdntq.apps.googleusercontent.com";

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <GoogleOAuthProvider clientId={CLIENT_ID}>
            <RouterProvider router={router} />
        </GoogleOAuthProvider>
    </StrictMode>
)
