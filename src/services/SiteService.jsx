import axios from "axios";
export const getAllSites = async (page,siteId)  => {
    const query = `http://localhost:8080/api/sites?page=${page}&siteId=${siteId}`
    
    try {
        let result = await axios.get(query);
        console.log(result.data)
        return result.data
    } catch (error) {
        console.log(error)
    }

}