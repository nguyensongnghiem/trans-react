import axios from "axios";
export const getAll = async () => {
    const query = `http://localhost:8080/api/transmissionOwner`
    try {
        let result = await axios.get(query);

        return result.data
    } catch (error) {
        console.log(error)
    }

}