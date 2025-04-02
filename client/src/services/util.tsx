export const getUrlByType = (type: string): string => {
    return {
        trip: '/group/trip.png',
        daily: '/group/daily.png',
        party: '/group/party.png',
        other: '/group/other.png'
    }[type] || '/group/other.png';
};