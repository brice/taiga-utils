#!/bin/bash
## Request username and password for connecting to Taiga
read -p "Username or email: " USERNAME
read -r -s -p "Password: " PASSWORD
#
DATA=$(jq --null-input \
        --arg username "$USERNAME" \
        --arg password "$PASSWORD" \
        '{ type: "normal", username: $username, password: $password }')
#
API=api.taiga.io
## Get AUTH_TOKEN
USER_AUTH_DETAIL=$( curl -X POST \
  -H "Content-Type: application/json" \
  -d "$DATA" \
  http://$API/api/v1/auth 2>/dev/null )
#
AUTH_TOKEN=$( echo ${USER_AUTH_DETAIL} | jq -r '.auth_token' )

# Exit if AUTH_TOKEN is not available
if [ -z ${AUTH_TOKEN} ]; then
    echo "Error: Incorrect username and/or password supplied"
    exit 1
else
    echo "auth_token is ${AUTH_TOKEN}"
fi

LAST_ID=$( curl -X GET \
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-s http://$API/api/v1/milestones\?project\=12 | jq '.[0]' | jq -r '.id' )

# echo $LAST_ID

USER_STORIES_LIST=$( curl -X GET \
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-s http://$API/api/v1/userstories?milestone=${LAST_ID} | jq -r '.[] | .id')

for i in `echo ${USER_STORIES_LIST}`
do
    USER_STORY_DETAIL=$( curl -X GET \
-H "Content-Type: application/json" \
-H "Authorization: Bearer ${AUTH_TOKEN}" \
-s http://$API/api/v1/userstories/${i} | jq -r '["/AMI 9.0/"+.subject,"1","T#"+(.ref|tostring),.subject] | @csv')
    echo $USER_STORY_DETAIL
done
