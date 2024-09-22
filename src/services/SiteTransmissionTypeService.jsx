import axios from "axios";
export const getAll = async () => {
    const query = `http://localhost:8080/api/site-transmission-types`
    try {
        let result = await axios.get(query);

        return result.data
    } catch (error) {
        console.log(error)
    }

}

export const getTotalFoSite = async () => {
    const query = `http://localhost:8080/api/site-transmission-types/totalFo`
    try {
        let result = await axios.get(query);

        return result.data
    } catch (error) {
        console.log(error)
    }

}


export const getTotalMWSite = async () => {
    const query = `http://localhost:8080/api/site-transmission-types/totalMW`
    try {
        let result = await axios.get(query);

        return result.data
    } catch (error) {
        console.log(error)
    }

}

export const getTotalLLSite = async () => {
    const query = `http://localhost:8080/api/site-transmission-types/totalLL`
    try {
        let result = await axios.get(query);

        return result.data
    } catch (error) {
        console.log(error)
    }

}