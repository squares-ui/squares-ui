<?php
/*******************************************************************************************************
*                                                                                                      *
* COPYRIGHT NOTICE                                                                                     *
* Unpublished Proprietary Work Copyright 2013 by Solera Networks, Inc., All Rights Reserved. This      *
* software and documentation are an unpublished proprietary work of Solera Networks and are protected  *
* by United States copyright laws and international treaties. This work may not be disclosed, copied,  *
* reproduced, translated, modified, compiled, reduced to machine-readable form or distributed in any   *
* manner without the express written permission of Solera Networks, Inc.                               *
*                                                                                                      *
* GOVERNMENT RESTRICTED RIGHTS NOTICE                                                                  *
* This software and documentation are provided with restricted rights. Use, duplication or disclosure  *
* by the Government is subject to restrictions as set forth in subparagraph (c)(2)(ii) of the Rights   *
* in Technical Data and Computer Software clause at DFARS 252.227-7013 or subparagraphs (c)(1) and (2) *
* of the Commercial Computer Software - Restricted Rights at 48 CFR 52.227-19, as applicable.          *
* Contractor/manufacturer is Solera Networks, 10713 South Jordan Gateway, Suite 100, South Jordan,     *
* Utah, 84095                                                                                          *
*                                                                                                      *
*******************************************************************************************************/
/**
 * This class is a helper class to connect to a Solera appliance
 */
class SoleraConnector {

	private $version = '';

	/**
	 * The constructor for this Class.
	 * It takes several arguments that are needed for connecting with the Solera appliance.
	 *
	 * @param string $username The name of the user that will be
	 * 				 Example: admin
	 * @param string $apiKey The api key
	 * 				 Example: ab48FhdsWu239sjcbsjkppwoiopqbg
	 * @param string $ip The ip address of the Solera appliance
	 * 				 Example: 10.0.1.1
	 * @param int $version The api version to use. If not provided, the latest version will be used.
	 */
	public function SoleraConnector ($username, $apiKey, $ip, $version = null) {
		$this->userName = $username;
		$this->apiKey = $apiKey;
		$this->ip = $ip;

		if ($version === null) {
			$result = $this->getVersions();
			if (isset($result['response'])) {
				$version = array_pop($result['response']);
			} else {
				throw new Exception('Unable to determine api version');
			}
		}

		$this->version = $version;
	}

	public function getVersions() {
		$url = 'https://' . $this->ip . '/api/list';

		return $this->request('GET', $url);
	}

	/**
	 * Call an API of the Solera appliance
	 * This can only be used on JSON data APIs and not with downloads
	 *
	 * @param string $method A string that is either "GET" or "POST" based one API call
	 * 				 Example: "GET"
	 * @param string $url A string that is the route for an API
	 * 				 Example: "/web_interface/motd"
	 * @param string $data An array of data that will be put into the POST data for the call(even if the method is GET)
	 *
	 * @param string $download A string of the filename you want to give your download.
	 * @return array An array of the
	 */
	public function callAPI($method, $url, array $data = array(), $download = false) {
		if (strpos($url, '/') === 0) {
			$url = substr($url, 1);
		}

		$url = "https://" . $this->ip . "/api/v" . $this->version . "/" . $url;

		return $this->request($method, $url, $data, $download);
	}

	protected function request($method, $url, array $data = array(), $download = false) {

		//Start to setup curl request
		$ch = curl_init();

		curl_setopt($ch, CURLOPT_URL, $url);

		//Added a timeout so that the test will fail if the call never comes back
		curl_setopt ($ch, CURLOPT_CONNECTTIMEOUT, 120);
		curl_setopt ($ch, CURLOPT_TIMEOUT, 300);

		curl_setopt($ch, CURLOPT_USERAGENT, 'API Request');

		//return the transfer as a string
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

		//We use self signed certs so we will need to ignore SSL warnings.
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
		curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
		curl_setopt($ch, CURLOPT_BINARYTRANSFER, true);

		curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
		curl_setopt($ch, CURLOPT_USERPWD, $this->userName . ':' . $this->apiKey);

		//If this is a post then we have to set the data
		//certain gets also need this post data set
		if (count($data) > 0) {
			$post = array();
			foreach ($data as $key => $d) {
				if (is_string($d) && is_file($d)) {
					$post[$key] = '@' . $d;
				} elseif (is_object($d) && get_class($d) === 'CURLFile') {
					$post[$key] = $d;
				} else {
					$post[$key] = json_encode($d);
				}
			}
			if (strtoupper($method) != 'POST') {
				$post['_method'] = $method;
			}
			curl_setopt($ch, CURLOPT_POST, 1);
			curl_setopt($ch, CURLOPT_POSTFIELDS, $post);
		} elseif (strtoupper($method) === 'POST') {
			$post = array();
			$post['_method'] = $method;
			curl_setopt($ch, CURLOPT_POST, 1);
			curl_setopt($ch, CURLOPT_POSTFIELDS, $post);
		}

		if ($download) {
			$fp = fopen($download, 'w');
			curl_setopt($ch, CURLOPT_FILE, $fp);
		}

		//Execute the curl command
		$output = curl_exec($ch);

		//In case of an error
		if (curl_errno($ch) !== 0) {
			throw new Exception('CURL error: ' . curl_error($ch));
		}

		if ($download) {
			$stat = fstat($fp);
			fclose($fp);
			curl_close($ch);
			return array('download_file' => $download, 'filesize' => $stat['size']);
		}

		//Close CURL
		curl_close($ch);

		//If we get a bogus empty response, we'll just return an empty array instead of failing here and let the calling test deal with it.
		if (empty($output)) {
			return array();
		}

		//Decode
		$jsonOutput = json_decode($output, true);
		if (is_null($jsonOutput)) {
			echo $output . "\n";
		}

		//Return the result
		return $jsonOutput;
	}
}
