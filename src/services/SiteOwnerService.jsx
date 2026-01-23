import axios from "../libs/axios/axiosConfig";
export const getAll = async () => {
    const query = `/siteOwners`
    try {
        let result = await axios.get(query);

        return result.data
    } catch (error) {
        console.log(error)
    }

}