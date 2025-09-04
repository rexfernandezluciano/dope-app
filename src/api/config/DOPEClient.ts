/** @format */

import axios from "axios";

export enum RequestMethod {
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
			timeout: 60 * 1000,
		});
	}

	static getInstance(): DOPEClient {
		if (!this.instance) {
			this.instance = new DOPEClient();
		}
		return this.instance;
	}

	public apiRequest = async (path: string, method: RequestMethod = RequestMethod.GET, data = {}, headers = {}): Promise<JSON> => {
		try {
			const res = await this.client({
				url: path,
				method: method,
				data: data,
				headers: { ...headers, "Content-Type": "application/json" },
			});
			
			if (!res?.status) {
			  throw new Error("Undefined Status:", res?.status || 0);
			}

			switch (res?.status) {
				case 200:
					return res.data;
				case 401:
					throw new Error(res.data.message || "Unauthorized");
				default:
					throw new Error(res.data.message || "An error occured");
			}
		} catch (error) {
			throw new Error(error.message || "Server Error");
		}
	};

	getHomeFeed = async (limit = 10, random = true): Promise<JSON> => {
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
