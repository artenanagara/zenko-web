#!/usr/bin/env bash
set -Eeuo pipefail

if [[ ${EUID} -ne 0 ]]; then
  echo "deploy-web must run as root" >&2
  exit 1
fi

release_id=${1:-}
archive=${2:-}

if [[ ! ${release_id} =~ ^[0-9a-f]{40}$ ]]; then
  echo "release id must be a full Git commit SHA" >&2
  exit 1
fi

expected_archive="/tmp/zenko-web-${release_id}.tar.gz"
if [[ ${archive} != "${expected_archive}" || ! -f ${archive} ]]; then
  echo "deployment archive is missing or has an unexpected path" >&2
  exit 1
fi

app_root=/opt/zenko/web
release_dir="${app_root}/releases/${release_id}"
current_link="${app_root}/current"
previous_release=

if [[ -L ${current_link} ]]; then
  previous_release=$(readlink -f "${current_link}")
fi

install -d -o zenko -g zenko -m 0755 "${app_root}/releases"

if [[ ! -d ${release_dir} ]]; then
  install -d -o zenko -g zenko -m 0755 "${release_dir}"
  tar --extract --gzip --file "${archive}" --directory "${release_dir}" --no-same-owner
  chown -R zenko:zenko "${release_dir}"
fi

ln -sfn "${release_dir}" "${app_root}/current.next"
mv -Tf "${app_root}/current.next" "${current_link}"
systemctl restart zenko-web.service

healthy=false
for _ in {1..30}; do
  if curl --fail --silent --show-error http://127.0.0.1:3000/ >/dev/null; then
    healthy=true
    break
  fi
  sleep 1
done

if [[ ${healthy} != true ]]; then
  if [[ -n ${previous_release} && -d ${previous_release} ]]; then
    ln -sfn "${previous_release}" "${app_root}/current.next"
    mv -Tf "${app_root}/current.next" "${current_link}"
    systemctl restart zenko-web.service
  fi
  journalctl -u zenko-web.service --no-pager -n 50 >&2
  exit 1
fi

rm -f "${archive}"
echo "Zenko Web deployed at ${release_id}"
