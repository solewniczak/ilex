package ilex

import (
	"bytes"
	"errors"
	"gopkg.in/mgo.v2"
	"gopkg.in/mgo.v2/bson"
	"unicode/utf8"
)

func length_of_first_n_runes_in_array(array []byte, n int) int {
	length := 0
	for i := 0; i < n; i++ {
		_, l := utf8.DecodeRune(array[length:])
		length += l
	}
	return length
}

func min(a, b int) int {
	if a < b {
		return a
	} else {
		return b
	}
}

func Persist(text []byte, slices *mgo.Collection) (err error, text_address, text_length_runes int) {
	if !utf8.Valid(text) {
		return errors.New(string(text) + " is not a valid utf-8 text!"), 0, 0
	}
	text_length_runes = utf8.RuneCount(text)
	runes_written, bytes_written, total_runes_to_write := 0, 0, text_length_runes

	slice := Slice{}

	total_slices, err := slices.Count()
	if total_slices == 0 {
		slice.No = -1
		text_address = 0
	} else {
		// get the last slice:
		err = slices.Find(bson.M{"No": total_slices - 1}).One(&slice)
		if err != nil {
			return err, 0, 0
		}

		slice_length_runes := utf8.RuneCountInString(slice.Text)
		text_address = (total_slices-1)*SLICE_SIZE + slice_length_runes

		empty_space := SLICE_SIZE - slice_length_runes
		if empty_space != 0 {
			// fill the slice with some of the buffer
			runes_to_write := min(empty_space, total_runes_to_write)
			length_to_write := length_of_first_n_runes_in_array(text[bytes_written:], runes_to_write)
			slice.Text = slice.Text + string(text[bytes_written:bytes_written+length_to_write])
			if err = slices.UpdateId(slice.Id, bson.M{"$set": bson.M{"Text": slice.Text}}); err != nil {
				return err, 0, 0
			}
			total_runes_to_write -= runes_to_write
			runes_written += runes_to_write
			bytes_written += length_to_write
		}
	}

	for total_runes_to_write != 0 {
		slice.No += 1
		slice.Id = bson.NewObjectId()
		runes_to_write := min(total_runes_to_write, SLICE_SIZE)
		length_to_write := length_of_first_n_runes_in_array(text[bytes_written:], runes_to_write)
		slice.Text = string(text[bytes_written : bytes_written+length_to_write])
		if err = slices.Insert(&slice); err != nil {
			return err, 0, 0
		}
		total_runes_to_write -= runes_to_write
		runes_written += runes_to_write
		bytes_written += length_to_write
	}

	return nil, text_address, text_length_runes
}

func get_substring(source string, start_rune, end_rune int) string {
	i := 0
	var start_byte, end_byte int
	for pos, _ := range source {
		if i == start_rune {
			start_byte = pos
		}
		if i == end_rune {
			end_byte = pos
		}
		i++
	}
	if end_byte == 0 {
		end_byte = len(source)
	}
	return (source)[start_byte:end_byte]

}

func ReadBlockFromPermascrollToBuffer(runes_to_read, address int, buffer *bytes.Buffer, slices *mgo.Collection) error {
	var slice Slice
	// read from somewhere from first slice
	slice_no := address / SLICE_SIZE
	rune_no_in_slice := address % SLICE_SIZE

	err := slices.Find(bson.M{"No": slice_no}).One(&slice)
	if err != nil {
		return err
	}
	runes_in_slice := utf8.RuneCountInString(slice.Text)
	runes_to_read_from_slice := min(runes_in_slice-rune_no_in_slice, runes_to_read)
	buffer.WriteString(get_substring(slice.Text, rune_no_in_slice, rune_no_in_slice+runes_to_read_from_slice))

	runes_to_read -= runes_to_read_from_slice

	// read from subsequent slices starting from 0th rune
	for runes_to_read > 0 {
		slice_no++

		err := slices.Find(bson.M{"No": slice_no}).One(&slice)
		if err != nil {
			return err
		}

		runes_in_slice := utf8.RuneCountInString(slice.Text)
		runes_to_read_from_slice := min(runes_in_slice, runes_to_read)
		buffer.WriteString(get_substring(slice.Text, 0, runes_to_read_from_slice))

		runes_to_read -= runes_to_read_from_slice
	}

	return nil
}

func GetStringFromAddresses(addresses AddressTable, total_runes int, database *mgo.Database) (string, error) {
	// @ TO DO: add support for zero-length files

	slices := database.C(PERMASCROLL)
	var buffer bytes.Buffer
	last_address := len(addresses) - 1
	runes_read := 0
	for i, a := range addresses[0:last_address] {
		runes_to_read := addresses[i+1][0] - a[0]
		if err := ReadBlockFromPermascrollToBuffer(runes_to_read, a[1], &buffer, slices); err != nil {
			return "", err
		}
		runes_read += runes_to_read
	}

	runes_to_read := total_runes - runes_read
	if err := ReadBlockFromPermascrollToBuffer(runes_to_read,
		addresses[last_address][1], &buffer, slices); err != nil {
		return "", err
	}

	str := buffer.String()
	return str, nil
}

func GetLatestVersion(database *mgo.Database, doc *Document, version *Version) error {
	versions := database.C(VERSIONS)
	return versions.Find(bson.M{"DocumentId": doc.Id, "No": doc.TotalVersions}).One(&version)
}

func UpdateDocument(docs *mgo.Collection, doc *Document, version *Version) error {
	doc.TotalVersions = version.No
	doc.Modified = version.Finished
	return docs.UpdateId(doc.Id, bson.M{"$set": bson.M{"Modified": version.Finished, "TotalVersions": version.No}})
}
