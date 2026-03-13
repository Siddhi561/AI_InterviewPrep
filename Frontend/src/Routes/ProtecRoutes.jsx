import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

export const ProtecRoutes = ({ children }) => {
    const { isAuthenticated } = useSelector((state) => state.userReducer) // ✅ exact spelling
    
    console.log("isAuthenticated:", isAuthenticated) // ← add this temporarily

    if (!isAuthenticated) {
        return <Navigate to='/' replace />
    }

    return children
}