import json
import os
import base64

def extract_files(json_file_path):
    """
    Extract files from source-code.json and write them to disk
    
    Args:
        json_file_path (str): Path to the source-code.json file
    """
    # Read the JSON file
    with open(json_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Get the files array
    files = data.get('files', [])
    
    print(f"Found {len(files)} files in {json_file_path}")
    
    # Process each file
    for file in files:
        file_name = file.get('name')
        contents = file.get('contents')
        is_binary = file.get('binary', False)
        
        # Create directory structure if needed
        dir_path = os.path.dirname(file_name)
        if dir_path and not os.path.exists(dir_path):
            os.makedirs(dir_path, exist_ok=True)
        
        # Write the file
        try:
            if is_binary:
                # For binary files, the content should be base64 encoded, but since
                # we don't have that content in the JSON, we'll just create an empty file
                # or skip the file if there's no content
                print(f"Skipping binary file: {file_name} (binary data handling not implemented)")
                continue
            else:
                # For text files, write the content as is
                with open(file_name, 'w', encoding='utf-8') as out_file:
                    if contents:
                        out_file.write(contents)
                print(f"Created file: {file_name}")
        except Exception as e:
            print(f"Error creating file {file_name}: {str(e)}")

if __name__ == "__main__":
    json_file_path = "source-code.json"
    extract_files(json_file_path)
    print("File extraction complete!")
