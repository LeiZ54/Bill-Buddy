export const parseJWT = (token: string) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        return null;
    }
}


type AuthResponse = {
    data: {
        token: string;
        username: string;
        email: string;
    };
};

export const saveJWT = (response: AuthResponse) => {
    const token = response.data.token;
    const payload = parseJWT(token);
    localStorage.setItem("token", token);
    localStorage.setItem("token_exp", payload.exp.toString());
    localStorage.setItem("userName", response.data.username);
    localStorage.setItem("email", response.data.email);
};