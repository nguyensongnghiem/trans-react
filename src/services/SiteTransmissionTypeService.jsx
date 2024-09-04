import axios from "axios";
export const getAll = async ()  => {
    const query = `http://localhost:8080/api/site-transmission-type`
    try {
        let result = await axios.get(query);
        console.log(result.data)
        return result.data
    } catch (error) {
        console.log(error)
    }

}