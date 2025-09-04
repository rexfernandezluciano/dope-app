/** @format */

import axios from "axios";

enum RequestMethod {
	GET = "GET",
	POST = "POST",
	PATCH = "PATCH",
	DELETE = "DELETE",
	OPTION = "OPTION",
	HEAD = "HEAD",
}

class DOPEClient {
	private static instance: DOPEClient;

	private constructor() {
		this.client = axios.create({
			baseURL: "https://api.dopp.eu.org",
			timeout: 60 * 1000
		});
	}

	static getInstance(): DOPEClient {
		if (!this.instance) {
			this.instance = new DOPEClient();
		}
		return this.instance;
	}

	private apiRequest = async (path: string, method: RequestMethod = RequestMethod.GET, headers = {}): Promise<JSON> => {
		try {
			const { data } = await this.client({
				url: path,
				method: method,
				headers: headers,
			});

			if (data.status === "ok") {
				return data;
			} else {
				throw new Error(data?.error?.message || "API Request Failed");
			}
		} catch (error) {
			throw new Error(error.message || "Server Error");
		}
	};

	getHomeFeed = async (limit = 10, random = true ): Promise<JSON> => {
		try {
			const result = await this.apiRequest(`/v1/posts?limit=${limit}&random=${random}`);
			if (result && result.posts) {
				return result.posts;
			} else {
				console.error("Error fetching posts:", result.message || result.error || "No error message");
				return null;
			}
		} catch (error) {
			console.error(error.message);
			return null;
		}
	};
}

export default DOPEClient;
