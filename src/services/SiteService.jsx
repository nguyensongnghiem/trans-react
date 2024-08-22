import axios from "axios";
export const getAllSites = async ()  => {
    try {
        let result = await axios.get('http://localhost:8080/api/sites');
        
        return result.data
    } catch (error) {
        console.log(error)
    }

}